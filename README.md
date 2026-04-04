# 🌿 Plant Science Data Analysis Suite

## Project Structure
```
plant-stats-suite/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── main.py                        # register new modules here (1 line)
│   ├── requirements.txt
│   ├── core/
│   │   └── config.py                  # shared config (paths, settings)
│   ├── modules/                       # ← ADD NEW MODULES HERE
│   │   └── correlation/
│   │       ├── router.py
│   │       └── r_scripts/
│   │           └── correlation_analysis.R
│   └── outputs/                       # session files (auto-created)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                    # add new module routes here (1 line)
        ├── components/
        │   └── Navbar.jsx             # add new nav items here (1 line)
        └── modules/                   # ← ADD NEW MODULES HERE
            └── correlation/
                └── CorrelationModule.jsx
```

## Adding a New Module (e.g. ANOVA)

### Backend — 2 steps
1. Create backend/modules/anova/router.py + r_scripts/anova_analysis.R
2. In main.py uncomment:
   from modules.anova.router import router as anova_router
   app.include_router(anova_router)

### Frontend — 2 steps
1. Create frontend/src/modules/anova/AnovaModule.jsx
2. In App.jsx uncomment the anova import and MODULE_MAP entry
3. In Navbar.jsx uncomment the anova entry

## Run Locally
docker-compose up --build
# → http://localhost

## Available Modules
| Module | Status |
|--------|--------|
| Correlation (Pearson/Spearman/Kendall) | Ready |
| ANOVA (One-way, Two-way, Three-way) | Next |
| PCA & Multivariate | Planned |
| Regression | Planned |
