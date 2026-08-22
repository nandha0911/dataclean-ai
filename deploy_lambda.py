"""
deploy_lambda.py — One-click AWS Lambda deployment script
==========================================================
Run from the project root:
    python deploy_lambda.py

Requirements:
    pip install boto3
    aws configure  (must be done first)
"""
import os
import shutil
import subprocess
import sys
import zipfile
import boto3
import tempfile

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# ── Configuration ────────────────────────────────────────────────────────
FUNCTION_NAME   = "dataclean-ai-backend"
REGION          = "ap-south-1"           # Mumbai — change if needed
RUNTIME         = "python3.11"
HANDLER         = "main.handler"          # main.py → handler = Mangum(app)
TIMEOUT         = 900                     # 15 minutes max
MEMORY          = 1024                    # 1 GB RAM (ML models need this)
BACKEND_DIR     = os.path.join(os.path.dirname(__file__), "backend")
BUILD_DIR       = os.path.join(tempfile.gettempdir(), "lambda_build")
ZIP_PATH        = os.path.join(tempfile.gettempdir(), "dataclean_lambda.zip")

def run(cmd, cwd=None):
    print(f"  $ {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def build_package():
    print("\n📦  Building Lambda deployment package …")
    if os.path.exists(BUILD_DIR):
        shutil.rmtree(BUILD_DIR)
    os.makedirs(BUILD_DIR)

    # Install dependencies into build dir
    run(f"pip install -r requirements.txt -t {BUILD_DIR} --quiet", cwd=BACKEND_DIR)

    # Copy backend source files
    for item in os.listdir(BACKEND_DIR):
        src = os.path.join(BACKEND_DIR, item)
        dst = os.path.join(BUILD_DIR, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(src, dst)

    # Create zip
    print("  🗜️   Zipping package …")
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(BUILD_DIR):
            # Skip heavy unused packages to stay under 250 MB limit
            dirs[:] = [d for d in dirs if d not in [
                "__pycache__", ".git", "tests", "test",
                "matplotlib", "seaborn", "missingno",
            ]]
            for file in files:
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, BUILD_DIR)
                zf.write(filepath, arcname)

    size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
    print(f"  ✅  Package ready: {ZIP_PATH} ({size_mb:.1f} MB)")
    return ZIP_PATH

def get_or_create_role(iam):
    """Get existing Lambda execution role or create one."""
    role_name = "dataclean-lambda-role"
    try:
        role = iam.get_role(RoleName=role_name)
        print(f"  ✅  Using existing IAM role: {role_name}")
        return role["Role"]["Arn"]
    except iam.exceptions.NoSuchEntityException:
        pass

    print(f"  🔧  Creating IAM role: {role_name} …")
    trust_policy = """{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }"""
    role = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=trust_policy,
        Description="Lambda execution role for DataClean AI",
    )
    iam.attach_role_policy(
        RoleName=role_name,
        PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    )
    import time; time.sleep(10)  # Wait for role propagation
    return role["Role"]["Arn"]

def deploy_lambda(zip_path, role_arn):
    print("\n🚀  Deploying to AWS Lambda …")
    client = boto3.client("lambda", region_name=REGION)

    with open(zip_path, "rb") as f:
        zip_bytes = f.read()

    try:
        # Update existing function
        client.update_function_code(
            FunctionName=FUNCTION_NAME,
            ZipFile=zip_bytes,
        )
        client.update_function_configuration(
            FunctionName=FUNCTION_NAME,
            Timeout=TIMEOUT,
            MemorySize=MEMORY,
            Handler=HANDLER,
        )
        print(f"  ✅  Lambda function updated: {FUNCTION_NAME}")
    except client.exceptions.ResourceNotFoundException:
        # Create new function
        client.create_function(
            FunctionName=FUNCTION_NAME,
            Runtime=RUNTIME,
            Role=role_arn,
            Handler=HANDLER,
            Code={"ZipFile": zip_bytes},
            Timeout=TIMEOUT,
            MemorySize=MEMORY,
            Environment={"Variables": {
                "UPLOAD_DIR": "/tmp/uploads",
                "REPORTS_DIR": "/tmp/reports",
                "DATABASE_URL": "sqlite:////tmp/dataclean.db",
            }},
        )
        print(f"  ✅  Lambda function created: {FUNCTION_NAME}")

def create_api_gateway(region, function_name, account_id):
    print("\n🌐  Creating API Gateway (HTTP API) …")
    apigw = boto3.client("apigatewayv2", region_name=region)
    lam   = boto3.client("lambda", region_name=region)

    # Create HTTP API
    api = apigw.create_api(
        Name=f"{function_name}-api",
        ProtocolType="HTTP",
        CorsConfiguration={
            "AllowOrigins": ["*"],
            "AllowMethods": ["*"],
            "AllowHeaders": ["*"],
        },
    )
    api_id = api["ApiId"]

    # Create Lambda integration
    func_arn = f"arn:aws:lambda:{region}:{account_id}:function:{function_name}"
    integration = apigw.create_integration(
        ApiId=api_id,
        IntegrationType="AWS_PROXY",
        IntegrationUri=func_arn,
        PayloadFormatVersion="2.0",
    )

    # Route: ANY /{proxy+}
    apigw.create_route(
        ApiId=api_id,
        RouteKey="$default",
        Target=f"integrations/{integration['IntegrationId']}",
    )

    # Deploy
    apigw.create_stage(ApiId=api_id, StageName="$default", AutoDeploy=True)

    # Grant API Gateway permission to invoke Lambda
    lam.add_permission(
        FunctionName=function_name,
        StatementId="apigateway-invoke",
        Action="lambda:InvokeFunction",
        Principal="apigateway.amazonaws.com",
        SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/*",
    )

    endpoint = f"https://{api_id}.execute-api.{region}.amazonaws.com"
    print(f"\n  🎉  API Gateway live at: {endpoint}")
    return endpoint

def main():
    print("=" * 60)
    print("  DataClean AI — AWS Lambda Deployment")
    print("=" * 60)

    # Verify AWS credentials
    try:
        sts = boto3.client("sts", region_name=REGION)
        identity = sts.get_caller_identity()
        account_id = identity["Account"]
        print(f"\n✅  AWS credentials OK — Account: {account_id}")
    except Exception as e:
        print(f"\n❌  AWS credentials not configured: {e}")
        print("   Run: aws configure")
        sys.exit(1)

    iam = boto3.client("iam", region_name=REGION)
    role_arn = get_or_create_role(iam)

    zip_path = build_package()
    deploy_lambda(zip_path, role_arn)

    endpoint = create_api_gateway(REGION, FUNCTION_NAME, account_id)

    print("\n" + "=" * 60)
    print("  ✅  DEPLOYMENT COMPLETE!")
    print("=" * 60)
    print(f"\n  🔗  Your free AWS backend URL:")
    print(f"      {endpoint}")
    print(f"\n  📋  Paste this URL in DataClean AI Settings page")
    print(f"      → Backend API Endpoint → Save")
    print("\n  💡  Health check:")
    print(f"      {endpoint}/health")
    print("=" * 60)


if __name__ == "__main__":
    main()
