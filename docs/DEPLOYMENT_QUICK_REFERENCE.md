# 🚀 GCP Deployment Quick Reference

## Essential URLs
- **Production**: http://35.200.252.186/
- **Local Frontend**: http://localhost:5174/
- **Local Backend**: http://localhost:3001/
- **GitLab Repo**: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces

## 🔥 Quick Deploy Workflow

### 1️⃣ Standard Deployment
```bash
# Make your changes locally
git add .
git commit -m "your changes description"
git push origin production
deploy-from-gitlab
```

### 2️⃣ Emergency Commands
```bash
# Quick health check
curl -s http://35.200.252.186/api/health | jq .

# View production logs
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a \
  --command="sudo docker-compose -f /opt/gentle-space-realty/deploy/docker-compose.yml logs --tail=50"

# Restart production containers
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a \
  --command="cd /opt/gentle-space-realty && sudo docker-compose -f deploy/docker-compose.yml restart"
```

## 🛠️ Local Development

### Start Development Environment
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend  
cd backend && NODE_ENV=development npm run dev
```

### Test Locally
```bash
# Frontend test
curl -s http://localhost:5174/ | grep -o '<title>.*</title>'

# Backend API test
curl -s http://localhost:3001/api/health | jq .
curl -s http://localhost:3001/api/v1/properties | jq 'length'
```

## 🔧 Troubleshooting

### Common Issues
| Issue | Quick Fix |
|-------|-----------|
| Properties not loading | `curl -v http://35.200.252.186/api/v1/properties` |
| Deployment failed | Check GitLab pipeline: `/pipelines` |
| Containers down | `deploy-from-gitlab` |
| Rate limiting | Restart backend: Kill & start dev server |

### Emergency Rollback
```bash
# Rollback to previous commit
git log --oneline -5
git revert <commit-hash>
git push origin production
```

## 📊 Monitoring

### Health Checks
```bash
# Production health
curl -s http://35.200.252.186/api/health | jq .
curl -s http://35.200.252.186/api/v1/properties | jq 'length'

# Container status
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a \
  --command="sudo docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `.env` | Local development config |
| `deploy/.env.production` | Production config |
| `.gitlab-ci.yml` | CI/CD pipeline |
| `deploy/docker-compose.yml` | Container orchestration |
| `deploy/gitlab-deploy.sh` | Deployment script |

## 🆘 Emergency Contacts

- **Production URL**: http://35.200.252.186/
- **GCP Project**: sragupathi-641f4622
- **GCP Zone**: asia-south1-a
- **Instance**: gentle-space-realty-vm

## 📚 Full Documentation
See `docs/GCP_DEPLOYMENT_WORKFLOW.md` for complete details.

---
*Keep this reference handy for quick deployments!*