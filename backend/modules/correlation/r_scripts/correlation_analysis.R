#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(jsonlite)
  library(corrplot)
  library(ggplot2)
  library(GGally)
  library(openxlsx)
})

args       <- commandArgs(trailingOnly = TRUE)
input_json <- args[1]
output_dir <- args[2]

params    <- fromJSON(input_json)
data      <- as.data.frame(params$data)
method    <- tolower(params$method)
sig_level <- ifelse(is.null(params$sig_level), 0.05, params$sig_level)

heatmap_palette <- ifelse(is.null(params$heatmap_palette), "RdBu",  params$heatmap_palette)
axis_font_size  <- ifelse(is.null(params$axis_font_size),  0.85,    params$axis_font_size)
show_coef       <- ifelse(is.null(params$show_coef),       TRUE,    params$show_coef)
plot_title      <- ifelse(is.null(params$plot_title),      "",      params$plot_title)
scatter_dpi     <- ifelse(is.null(params$scatter_dpi),     150,     params$scatter_dpi)
scatter_width   <- ifelse(is.null(params$scatter_width),   1200,    params$scatter_width)
scatter_height  <- ifelse(is.null(params$scatter_height),  1000,    params$scatter_height)

palette_map <- list(
  RdBu       = colorRampPalette(c("#d73027","#f46d43","#fdae61","#ffffff","#74add1","#4575b4"))(200),
  PRGn       = colorRampPalette(c("#762a83","#af8dc3","#f7f7f7","#7fbf7b","#1b7837"))(200),
  PiYG       = colorRampPalette(c("#c51b7d","#e9a3c9","#f7f7f7","#a1d76a","#4d9221"))(200),
  Colorblind = colorRampPalette(c("#0072B2","#56B4E9","#ffffff","#E69F00","#D55E00"))(200),
  Greyscale  = colorRampPalette(c("#000000","#888888","#ffffff"))(200),
  Blues      = colorRampPalette(c("#f7fbff","#6baed6","#08306b"))(200)
)
col_palette <- if (!is.null(palette_map[[heatmap_palette]])) palette_map[[heatmap_palette]] else palette_map[["RdBu"]]

num_data <- data[, sapply(data, is.numeric), drop = FALSE]
if (ncol(num_data) < 2) stop("Need at least 2 numeric columns")

n    <- nrow(num_data)
p    <- ncol(num_data)
vars <- colnames(num_data)

cor_mat <- cor(num_data, method = method, use = "pairwise.complete.obs")
p_mat   <- matrix(NA, p, p, dimnames = list(vars, vars))
for (i in 1:p) {
  for (j in 1:p) {
    p_mat[i, j] <- if (i != j) cor.test(num_data[[i]], num_data[[j]], method = method)$p.value else 1
  }
}

sig_mat <- matrix("", p, p, dimnames = list(vars, vars))
for (i in 1:p) {
  for (j in 1:p) {
    if (i == j) { sig_mat[i,j] <- "-"; next }
    pv <- p_mat[i,j]
    if (!is.na(pv)) {
      if      (pv < 0.001) sig_mat[i,j] <- "***"
      else if (pv < 0.01)  sig_mat[i,j] <- "**"
      else if (pv < 0.05)  sig_mat[i,j] <- "*"
    }
  }
}

# --- EXCEL: plain write, zero styling on data cells ---
wb <- createWorkbook()

write_plain_sheet <- function(wb, sheet_name, df) {
  addWorksheet(wb, sheet_name)
  # Write header row manually with bold
  header_style <- createStyle(textDecoration = "bold", border = "Bottom", borderColour = "#888888")
  writeData(wb, sheet_name, df)
  addStyle(wb, sheet_name, header_style, rows = 1, cols = 1:ncol(df), gridExpand = TRUE)
  # NO style on data cells — leave completely unstyled (white by default)
  setColWidths(wb, sheet_name, cols = 1:ncol(df), widths = "auto")
}

write_plain_sheet(wb, "Correlation Matrix",
  cbind(Variable = vars, as.data.frame(round(cor_mat, 4))))
write_plain_sheet(wb, "P-values",
  cbind(Variable = vars, as.data.frame(round(p_mat, 6))))
write_plain_sheet(wb, "Significance",
  cbind(Variable = vars, as.data.frame(sig_mat)))

addWorksheet(wb, "Summary")
writeData(wb, "Summary", data.frame(
  Parameter = c("Method", "Sample Size", "Variables", "Significance"),
  Value     = c(toupper(method), n, p, "* p<0.05  ** p<0.01  *** p<0.001")
))

saveWorkbook(wb, file.path(output_dir, "correlation_results.xlsx"), overwrite = TRUE)

# --- HEATMAP: corrplot then manually draw stars ---
heatmap_title <- ifelse(nchar(plot_title) > 0, plot_title,
                        paste0(toupper(method), " Correlation Heatmap"))

png(file.path(output_dir, "correlation_heatmap.png"), width = 1000, height = 920, res = 120)
layout(matrix(c(1, 2), nrow = 2), heights = c(0.88, 0.12))
par(mar = c(0, 0, 2, 0))

# Draw corrplot WITHOUT p.mat (no blanking) so all cells are colored
corrplot(cor_mat,
  method      = "color",
  col         = col_palette,
  type        = "upper",
  order       = "hclust",
  addCoef.col = if (show_coef) "black" else NA,
  number.cex  = axis_font_size * 0.78,
  tl.col      = "#333333",
  tl.srt      = 45,
  tl.cex      = axis_font_size,
  title       = heatmap_title,
  mar         = c(0, 0, 2, 0)
)

# Get corrplot reordered indices (hclust order)
ord <- corrMatOrder(cor_mat, order = "hclust")
cor_ordered <- cor_mat[ord, ord]
p_ordered   <- p_mat[ord, ord]
p_vars      <- vars[ord]
n_vars      <- length(p_vars)

# corrplot upper triangle cell positions (in plot coordinates)
# corrplot maps variables to 1:p on both axes
for (i in 1:n_vars) {
  for (j in 1:n_vars) {
    if (j <= i) next  # upper triangle only
    pv <- p_ordered[i, j]
    if (is.na(pv)) next
    stars <- if (pv < 0.001) "***" else if (pv < 0.01) "**" else if (pv < 0.05) "*" else ""
    if (nchar(stars) == 0) next
    # corrplot coordinate system: x = j, y = n_vars + 1 - i
    x_pos <- j
    y_pos <- n_vars + 1 - i
    text(x_pos, y_pos, stars, cex = axis_font_size * 0.9,
         col = "black", font = 2, adj = c(0.5, -0.3))
  }
}

# Footnote
par(mar = c(0, 2, 0, 2))
plot.new()
text(0.5, 0.6,
  paste0("Significance: * p<0.05   ** p<0.01   *** p<0.001   (",
         toupper(method), " correlation, n=", n, ")"),
  cex = 0.82, col = "#444444", adj = 0.5)
dev.off()

# --- SCATTER MATRIX ---
scatter_title <- ifelse(nchar(plot_title) > 0, plot_title,
                        paste0(toupper(method), " Correlation — Scatter Matrix"))

upper_cor <- function(data, mapping, method = "pearson", ...) {
  x  <- GGally::eval_data_col(data, mapping$x)
  y  <- GGally::eval_data_col(data, mapping$y)
  ct <- cor.test(x, y, method = method)
  r  <- round(ct$estimate, 3)
  pv <- ct$p.value
  stars <- if (pv < 0.001) "***" else if (pv < 0.01) "**" else if (pv < 0.05) "*" else ""
  ggplot(data = data, mapping = mapping) +
    annotate("text",
      x      = mean(range(x, na.rm = TRUE)),
      y      = mean(range(y, na.rm = TRUE)),
      label  = paste0(r, stars),
      size   = axis_font_size * 4.5,
      colour = if (r > 0) "#0072B2" else "#D55E00",
      fontface = "bold") +
    theme_void()
}

png(file.path(output_dir, "scatter_matrix.png"),
    width = scatter_width, height = scatter_height, res = scatter_dpi)

p_scatter <- ggpairs(num_data,
  upper = list(continuous = wrap(upper_cor, method = method)),
  lower = list(continuous = wrap("smooth", alpha = 0.35,
                                  color = "#0072B2", fill = "#56B4E9", size = 0.6)),
  diag  = list(continuous = wrap("densityDiag", fill = "#009E73",
                                   alpha = 0.45, color = "#333333")),
  title = scatter_title
) + theme_minimal(base_size = axis_font_size * 12) +
  theme(
    plot.title       = element_text(face = "bold", size = axis_font_size * 13, color = "#1C1C1C"),
    strip.background = element_rect(fill = "#F0F0F0", color = "#CCCCCC"),
    strip.text       = element_text(face = "bold", color = "#333333")
  )
print(p_scatter)
dev.off()

result <- list(
  status = "success", method = method, n = n, variables = vars,
  cor_matrix = cor_mat, p_matrix = p_mat, sig_matrix = sig_mat,
  excel_file = "correlation_results.xlsx",
  heatmap_file = "correlation_heatmap.png",
  scatter_file = "scatter_matrix.png"
)
cat(toJSON(result, auto_unbox = TRUE, digits = 6))
