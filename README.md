# LivingIT Claude Workshop, April 2026

## Workstation Setup

### Required Software
- [ ] Node.js 20.19+
- [ ] Claude Code
  - Mac/Linux: `curl -fsSL https://claude.ai/install.sh | bash`
  - Powershell: `irm https://claude.ai/install.ps1 | iex` 
- [ ] OpenSpec (`npm install -g @fission-ai/openspec@latest`)
- [ ] Git (latest version)
- [ ] GitHub CLI (`brew install gh` or equivalent)
- [ ] VS Code or preferred editor

### Accounts Setup
- [ ] Claude Pro subscription (Day 1) or Claude Max subscription (Day 2)
- [ ] GitHub account with personal access token (repo scope)
- [ ] Run `claude` once to complete initial setup and accept permissions

### Verification
```bash
claude --version    # Should show 1.0.x or higher
openspec --version  # Should show 1.x.x or higher
gh auth status      # Should show authenticated
node --version      # Should show v20.19.x or higher
```
