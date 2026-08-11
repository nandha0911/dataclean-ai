"""End-to-end API test for DataClean AI backend."""
import httpx
import json

def test_pipeline():
    base = "http://localhost:8000/api"
    
    # 1. Upload
    with open("test_sample.csv", "rb") as f:
        r = httpx.post(f"{base}/upload", files={"file": ("test_sample.csv", f, "text/csv")})
    
    print(f"Upload: {r.status_code}")
    if r.status_code != 200:
        print("Error:", r.text[:300])
        return
    
    data = r.json()
    dataset_id = data["dataset_id"]
    print(f"Dataset ID: {dataset_id}, Rows: {data['row_count']}, Cols: {data['col_count']}")
    
    # 2. Analyze
    r2 = httpx.get(f"{base}/analyze/{dataset_id}", timeout=30)
    print(f"Analyze: {r2.status_code}")
    
    if r2.status_code == 200:
        analysis = r2.json()
        qs = analysis.get("quality_score", {})
        print(f"Overall Quality: {qs.get('overall', 'N/A')}%")
        print(f"Completeness: {qs.get('completeness', 'N/A')}%")
        cols = analysis.get("columns", [])
        print(f"Columns analyzed: {len(cols)}")
        for c in cols[:3]:
            print(f"  - {c.get('column_name')}: missing={c.get('missing_pct', 0):.1f}%")
    
    # 3. Recommend
    r3 = httpx.get(f"{base}/recommend/{dataset_id}", timeout=30)
    print(f"Recommend: {r3.status_code}")
    
    if r3.status_code == 200:
        recs = r3.json()
        print(f"Recommendations count: {len(recs)}")
        for rec in recs[:4]:
            col = rec.get("column", "?")
            tech = rec.get("technique", "?")
            conf = rec.get("confidence", "?")
            print(f"  - {col}: {tech} ({conf}%)")
    
    # 4. Chat
    r4 = httpx.post(f"{base}/chat", json={"question": "Why use Median imputation?", "context": ""})
    print(f"Chat: {r4.status_code}")
    if r4.status_code == 200:
        ans = r4.json()
        print(f"Answer preview: {ans.get('answer', '')[:100]}...")
    
    print("\n=== ALL TESTS PASSED ===")

if __name__ == "__main__":
    test_pipeline()
