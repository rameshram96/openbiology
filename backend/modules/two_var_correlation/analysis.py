"""
Two-Variable Correlation — Analysis Engine
Handles stat computation and matplotlib plot generation.
"""

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy import stats
from pathlib import Path

# ─── Constants ────────────────────────────────────────────────────────────────

SHAPE_MAP = {
    "circle":   "o",
    "triangle": "^",
    "square":   "s",
    "diamond":  "D",
    "cross":    "P",   # filled-plus; cleaner than "+"
}

# ─── Public API ───────────────────────────────────────────────────────────────

def run_analysis(x_data: list, y_data: list, x_col: str, y_col: str,
                 params: dict, session_dir: Path) -> dict:
    """
    Compute Pearson r, R², p-value, regression coefficients from raw data,
    generate PNG + SVG plot, and return the stats dict (without plot paths).
    Raw x/y arrays are stored in the returned dict so replot can re-draw
    without re-reading the original file.
    """
    x = np.array(x_data, dtype=float)
    y = np.array(y_data, dtype=float)

    # Drop NaN pairs
    mask = ~(np.isnan(x) | np.isnan(y))
    x, y = x[mask], y[mask]
    n    = len(x)

    if n < 3:
        raise ValueError(f"Need at least 3 valid data points (got {n} after dropping NaN rows)")

    slope, intercept, r, p_val, _ = stats.linregress(x, y)
    r2 = r ** 2

    result = {
        "r":         round(float(r), 4),
        "r2":        round(float(r2), 4),
        "p_value":   float(p_val),
        "slope":     round(float(slope), 6),
        "intercept": round(float(intercept), 6),
        "n":         int(n),
        "x_col":     x_col,
        "y_col":     y_col,
        # Store raw arrays so regenerate_plot can re-draw without the file
        "x_data":    x.tolist(),
        "y_data":    y.tolist(),
    }

    _draw(x, y, slope, intercept, r, r2, p_val, n, params,
          params.get("x_label") or x_col,
          params.get("y_label") or y_col,
          session_dir)

    return result


def regenerate_plot(stored: dict, params: dict, session_dir: Path) -> None:
    """Re-draw the plot from stored x/y arrays with new visual params."""
    x    = np.array(stored["x_data"])
    y    = np.array(stored["y_data"])
    n    = stored["n"]
    r    = stored["r"]
    r2   = stored["r2"]
    p    = stored["p_value"]
    sl   = stored["slope"]
    ic   = stored["intercept"]
    xcol = stored["x_col"]
    ycol = stored["y_col"]

    _draw(x, y, sl, ic, r, r2, p, n, params,
          params.get("x_label") or xcol,
          params.get("y_label") or ycol,
          session_dir)


# ─── Private ──────────────────────────────────────────────────────────────────

def _draw(x, y, slope, intercept, r, r2, p_val, n, params,
          x_label: str, y_label: str, session_dir: Path) -> None:

    line_color   = params.get("line_color",    "#2166AC")
    show_ci      = bool(params.get("show_ci",  True))
    point_color  = params.get("point_color",   "#444444")
    point_size   = float(params.get("point_size", 6))
    point_shape  = params.get("point_shape",   "circle")
    plot_title   = params.get("plot_title",    "")
    show_grid    = bool(params.get("show_grid", True))
    show_eq      = bool(params.get("show_equation", False))

    marker = SHAPE_MAP.get(point_shape, "o")

    fig, ax = plt.subplots(figsize=(7.2, 5.6), dpi=150)
    fig.patch.set_facecolor("#FAFAFA")
    ax.set_facecolor("#FAFAFA")

    # ── Scatter points ────────────────────────────────────────────────────────
    ax.scatter(x, y,
               c=point_color, s=point_size ** 2,
               marker=marker, alpha=0.78,
               edgecolors="white", linewidths=0.55,
               zorder=3)

    # ── Regression line ───────────────────────────────────────────────────────
    x_min, x_max = x.min(), x.max()
    pad      = (x_max - x_min) * 0.04
    x_line   = np.linspace(x_min - pad, x_max + pad, 400)
    y_line   = slope * x_line + intercept
    ax.plot(x_line, y_line, color=line_color, linewidth=1.9, zorder=4)

    # ── 95 % CI band ──────────────────────────────────────────────────────────
    if show_ci and n >= 4:
        x_mean = np.mean(x)
        ss_res = np.sum((y - (slope * x + intercept)) ** 2)
        s_err  = np.sqrt(ss_res / (n - 2))
        t_val  = stats.t.ppf(0.975, df=n - 2)
        se_fit = s_err * np.sqrt(1 / n + (x_line - x_mean) ** 2 /
                                  np.sum((x - x_mean) ** 2))
        ax.fill_between(x_line,
                        y_line - t_val * se_fit,
                        y_line + t_val * se_fit,
                        color=line_color, alpha=0.11, zorder=2)

    # ── Equation annotation ───────────────────────────────────────────────────
    if show_eq:
        sign = "+" if intercept >= 0 else "−"
        eq   = f"y = {slope:.3f}x {sign} {abs(intercept):.3f}"
        ax.text(0.04, 0.96, eq,
                transform=ax.transAxes, fontsize=8.5, va="top",
                color="#444",
                bbox=dict(boxstyle="round,pad=0.36",
                          fc="white", ec="#DDDDDD", alpha=0.88))

    # ── Styling ───────────────────────────────────────────────────────────────
    ax.set_xlabel(x_label, fontsize=10.5, labelpad=7, color="#333333")
    ax.set_ylabel(y_label, fontsize=10.5, labelpad=7, color="#333333")

    if plot_title:
        ax.set_title(plot_title, fontsize=11.5, fontweight="bold",
                     color="#1C1C1C", pad=10)

    ax.grid(show_grid, linestyle="--", linewidth=0.45,
            color="#DDDDDD", alpha=0.8, zorder=0)

    ax.spines[["top", "right"]].set_visible(False)
    ax.spines["left"].set_color("#CCCCCC")
    ax.spines["bottom"].set_color("#CCCCCC")
    ax.tick_params(colors="#999999", labelsize=9)

    plt.tight_layout(pad=1.4)

    fig.savefig(session_dir / "scatter_plot.png",
                dpi=150, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    fig.savefig(session_dir / "scatter_plot.svg",
                format="svg", bbox_inches="tight",
                facecolor=fig.get_facecolor())
    plt.close(fig)
