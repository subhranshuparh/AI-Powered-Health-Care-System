import requests
uri = "https://fair.healthinformationportal.eu/dataset/a8832b77-2075-400a-93b2-35d974261f80"
headers = {'Accept': 'text/turtle'}
res = requests.get(url=uri, headers=headers)
print(res.text)