#!/usr/bin/env Rscript

# Plant Science Correlation Analysis Suite
# Supports: Pearson, Spearman, Kendall
# Outputs: correlation matrix, p-values, scatter matrix plots, heatmap

suppressPackageStartupMessages({
  library(jsonlite)
  library(corrplot)
  library(ggplot2)
  library(reshape2)
  library(GGally)
  library(openxlsx)
  library(gridExtra)
})

args       <- commandArgs(trailingOnly = TRUE)
input_json <- args[1]
output_dir <- args[2]

params    <- fromJSON(input_json)
data      <- as.data.frame(params$data)
method    <- tolower(params$method)
sig_level <- ifelse(is.null(params$sig_level), 0.05, params$sig_level)

# --- Graph customization params ---
heatmap_palette  <- ifelse(is.null(params$heatmap_palette),  "RdBu",    params$heatmap_palette)
axis_font_size   <- ifelse(is.null(params$axis_font_size),   0.85,      params$axis_font_size)
show_coef        <- ifelse(is.null(params$show_coef),        TRUE,      params$show_coef)
plot_title       <- ifelse(is.null(params$plot_title),       "",        params$plot_title)
x_label          <- ifelse(is.null(params$x_label),          "",        params$x_label)
y_label          <- ifelse(is.null(params$y_label),          "",        params$y_label)
scatter_dpi      <- ifelse(is.null(params$scatter_dpi),      150,       params$scatter_dpi)
scatter_width    <- ifelse(is.null(params$scatter_width),    1200,      params$scatter_width)
scatter_height   <- ifelse(is.null(params$scatter_height),   1000,      params$scatter_height)

# Heatmap title
heatmap_title <- ifelse(
  nchar(plot_title) > 0,
  plot_title,
  paste0(toupper(method), " Correlation Heatmap (p<", sig_level, ")")
)

# Palette definitions (colorblind-friendly options included)
palette_map <- list(
  RdBu       = colorRampPalette(c("#d73027","#f46d43","#fdae61","#ffffff","#74add1","#4575b4"))(200),
  PRGn       = colorRampPalette(c("#762a83","#af8dc3","#f7f7f7","#7fbf7b","#1b7837"))(200),
  PiYG       = colorRampPalette(c("#c51b7d","#e9a3c9","#f7f7f7","#a1d76a","#4d9221"))(200),
  Oranges    = colorRampPalette(c("#fff5eb","#fd8d3c","#d94701"))(200),
  Blues      = colorRampPalette(c("#f7fbff","#6baed6","#08306b"))(200),
  Colorblind = colorRampPalette(c("#0072B2","#56B4E9","#ffffff","#E69F00","#D55E00"))(200),
  Greyscale  = colorRampPalette(c("#000000","#888888","#ffffff"))(200)
)

col_palette <- if (!is.null(palette_map[[heatmap_palette]])) {
  palette_map[[heatmap_palette]]
} else {
  palette_map[["RdBu"]]
}

# --- Numeric columns only ---
num_data <- data[, sapply(data, is.numeric), drop = FALSE]
if (ncol(num_data) < 2) stop("Need at least 2 numeric columns")

n    <- nrow(num_data)
p    <- ncol(num_data)
vars <- colnames(num_data)

# --- Correlation & p-value matrices ---
cor_mat <- cor(num_data, method = method, use = "pairwise.complete.obs")

p_mat <- matrix(NA, p, p, dimnames = list(vars, vars))
for (i in 1:p) {
  for (j in 1:p) {
    if (i != j) {
      test         <- cor.test(num_data[[i]], num_data[[j]], method = method)
      p_mat[i, j]  <- test$p.value
    } else {
      p_mat[i, j] <- 0
    }
  }
}

sig_mat <- ifelse(p_mat < sig_level, "*", "ns")
sig_mat[is.na(p_mat)] <- "NA"
diag(sig_mat) <- "-"

# --- EXPORT 1: Excel ---
wb <- createWorkbook()

addWorksheet(wb, "Correlation Matrix")
cor_df <- cbind(Variable = rownames(as.data.frame(round(cor_mat, 4))), as.data.frame(round(cor_mat, 4)))
writeData(wb, "Correlation Matrix", cor_df)

cor_style_pos <- createStyle(fontColour = "#155724", bgFill = "#d4edda")
cor_style_neg <- createStyle(fontColour = "#721c24", bgFill = "#f8d7da")
for (col_idx in 2:(p + 1)) {
  for (row_idx in 2:(p + 1)) {
    val <- cor_mat[row_idx - 1, col_idx - 1]
    if (!is.na(val) && row_idx - 1 != col_idx - 1) {
      if (val > 0) addStyle(wb, "Correlation Matrix", cor_style_pos, rows = row_idx, cols = col_idx)
      else         addStyle(wb, "Correlation Matrix", cor_style_neg, rows = row_idx, cols = col_idx)
    }
  }
}

addWorksheet(wb, "P-values")
p_df <- cbind(Variable = rownames(as.data.frame(round(p_mat, 6))), as.data.frame(round(p_mat, 6)))
writeData(wb, "P-values", p_df)

addWorksheet(wb, "Significance")
sig_df <- cbind(Variable = rownames(as.data.frame(sig_mat)), as.data.frame(sig_mat))
writeData(wb, "Significance", sig_df)

addWorksheet(wb, "Summary")
writeData(wb, "Summary", data.frame(
  Parameter = c("Method", "Sample Size", "Variables", "Significance Level",
                "Heatmap Palette", "Show Coefficients", "Scatter DPI"),
  Value     = c(toupper(method), n, p, sig_level,
                heatmap_palette, as.character(show_coef), scatter_dpi)
))

saveWorkbook(wb, file.path(output_dir, "correlation_results.xlsx"), overwrite = TRUE)

# --- EXPORT 2: Heatmap PNG ---
png(file.path(output_dir, "correlation_heatmap.png"), width = 900, height = 800, res = 120)

corrplot(cor_mat,
  method      = "color",
  col         = col_palette,
  type        = "upper",
  order       = "hclust",
  addCoef.col = if (show_coef) "black" else NA,
  number.cex  = axis_font_size * 0.82,
  tl.col      = "#333333",
  tl.srt      = 45,
  tl.cex      = axis_font_size,
  p.mat       = p_mat,
  sig.level   = sig_level,
  insig       = "blank",
  title       = heatmap_title,
  mar         = c(0, 0, 2, 0)
)
dev.off()

# --- EXPORT 3: Scatter Matrix PNG ---
scatter_title <- ifelse(nchar(plot_title) > 0,
  paste0(plot_title, " — Scatter Matrix"),
  paste0(toupper(method), " Correlation — Scatter Matrix")
)

png(file.path(output_dir, "scatter_matrix.png"),
    width = scatter_width, height = scatter_height, res = scatter_dpi)

p_scatter <- ggpairs(
  num_data,
  upper = list(continuous = wrap("cor", method = method, size = axis_font_size * 4,
                                  color = "#333333")),
  lower = list(continuous = wrap("smooth", alpha = 0.4,
                                  color = "#0072B2", fill = "#56B4E9")),
  diag  = list(continuous = wrap("densityDiag", fill = "#009E73",
                                   alpha = 0.5, color = "#333333")),
  title = scatter_title
) +
  theme_minimal(base_size = axis_font_size * 13) +
  theme(
    plot.title       = element_text(face = "bold", size = axis_font_size * 14, color = "#1C1C1C"),
    strip.background = element_rect(fill = "#F0F0F0", color = "#CCCCCC"),
    strip.text       = element_text(face = "bold", color = "#333333"),
    axis.title.x     = if (nchar(x_label) > 0) element_text(x_label) else element_blank(),
    axis.title.y     = if (nchar(y_label) > 0) element_text(y_label) else element_blank()
  )

print(p_scatter)
dev.off()

# --- JSON result ---
result <- list(
  status       = "success",
  method       = method,
  n            = n,
  variables    = vars,
  cor_matrix   = cor_mat,
  p_matrix     = p_mat,
  sig_matrix   = sig_mat,
  excel_file   = "correlation_results.xlsx",
  heatmap_file = "correlation_heatmap.png",
  scatter_file = "scatter_matrix.png"
)

cat(toJSON(result, auto_unbox = TRUE, digits = 6))
