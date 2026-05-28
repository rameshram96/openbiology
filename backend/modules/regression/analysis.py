import pandas as pd
import numpy as np
import statsmodels.api as sm
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.metrics import mean_squared_error
import os
import uuid


OUTPUT_DIR = "outputs"


def run_regression_analysis(df, dependent_var, independent_vars):

    # Prepare data
    X = df[independent_vars]
    y = df[dependent_var]

    # Add constant
    X = sm.add_constant(X)

    # Fit model
    model = sm.OLS(y, X).fit()

    # Predictions
    predictions = model.predict(X)

    # Residuals
    residuals = y - predictions

    # Metrics
    rmse = np.sqrt(mean_squared_error(y, predictions))

    # Coefficient table
    coef_table = pd.DataFrame({
        "Variable": model.params.index,
        "Coefficient": model.params.values,
        "Std_Error": model.bse.values,
        "t_value": model.tvalues.values,
        "p_value": model.pvalues.values,
        "CI_Lower": model.conf_int()[0].values,
        "CI_Upper": model.conf_int()[1].values
    })

    # ANOVA
    anova_table = sm.stats.anova_lm(model, typ=2)

    # Generate plots
    plot_paths = generate_plots(
        y,
        predictions,
        residuals
    )

    results = {
        "r_squared": round(model.rsquared, 4),
        "adjusted_r_squared": round(model.rsquared_adj, 4),
        "f_statistic": round(model.fvalue, 4),
        "f_pvalue": round(model.f_pvalue, 6),
        "rmse": round(rmse, 4),
        "equation": generate_equation(model),
        "coefficients": coef_table.round(4).to_dict(orient="records"),
        "anova": anova_table.round(4).reset_index().to_dict(orient="records"),
        "plots": plot_paths
    }

    return results


def generate_equation(model):

    params = model.params

    equation = f"Y = {round(params.iloc[0], 4)}"

    for var, coef in params.iloc[1:].items():
        sign = "+" if coef >= 0 else "-"
        equation += f" {sign} {abs(round(coef, 4))}({var})"

    return equation


def generate_plots(y, predictions, residuals):

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    plot_paths = {}

    # Residual vs Fitted
    plt.figure(figsize=(6, 5))
    sns.scatterplot(x=predictions, y=residuals)
    plt.axhline(0, linestyle='--')
    plt.xlabel("Fitted Values")
    plt.ylabel("Residuals")
    plt.title("Residuals vs Fitted")

    residual_plot = os.path.join(
        OUTPUT_DIR,
        f"residual_plot_{uuid.uuid4().hex}.png"
    )

    plt.savefig(residual_plot, bbox_inches='tight')
    plt.close()

    plot_paths["residual_plot"] = residual_plot

    # QQ Plot
    plt.figure(figsize=(6, 5))
    stats.probplot(residuals, dist="norm", plot=plt)
    plt.title("QQ Plot")

    qq_plot = os.path.join(
        OUTPUT_DIR,
        f"qq_plot_{uuid.uuid4().hex}.png"
    )

    plt.savefig(qq_plot, bbox_inches='tight')
    plt.close()

    plot_paths["qq_plot"] = qq_plot

    # Predicted vs Observed
    plt.figure(figsize=(6, 5))
    sns.scatterplot(x=y, y=predictions)

    min_val = min(min(y), min(predictions))
    max_val = max(max(y), max(predictions))

    plt.plot(
        [min_val, max_val],
        [min_val, max_val],
        linestyle='--'
    )

    plt.xlabel("Observed")
    plt.ylabel("Predicted")
    plt.title("Predicted vs Observed")

    pred_obs_plot = os.path.join(
        OUTPUT_DIR,
        f"pred_obs_plot_{uuid.uuid4().hex}.png"
    )

    plt.savefig(pred_obs_plot, bbox_inches='tight')
    plt.close()

    plot_paths["predicted_vs_observed"] = pred_obs_plot

    # Residual Histogram
    plt.figure(figsize=(6, 5))
    sns.histplot(residuals, kde=True)

    plt.xlabel("Residuals")
    plt.title("Residual Distribution")

    hist_plot = os.path.join(
        OUTPUT_DIR,
        f"hist_plot_{uuid.uuid4().hex}.png"
    )

    plt.savefig(hist_plot, bbox_inches='tight')
    plt.close()

    plot_paths["residual_histogram"] = hist_plot

    return plot_paths