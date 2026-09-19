
import urllib.request, json
url = "https://api.github.com/repos/chehak655/TickTheTask/actions/runs"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        for run in data.get("workflow_runs", [])[:5]:
            msg = run.get("head_commit", {}).get("message", "").split("\n")[0]
            print(run.get("name"), "-", run.get("status"), "-", run.get("conclusion"), "-", msg)
except Exception as e:
    print(e)

