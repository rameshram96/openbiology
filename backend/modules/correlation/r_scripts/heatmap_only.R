#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(jsonlite)
  library(corrplot)
})

args       <- commandArgs(trailingOnly = TRUE)
input_json <- args[1]
output_dir <- args[2]

params          <- fromJSON(input_json)
cor_mat         <- as.matrix(as.data.frame(params$cor_matrix))
p_mat           <- as.matrix(as.data.frame(params$p_matrix))
method          <- tolower(params$method)
heatmap_palette <- ifelse(is.null(params$heatmap_palette), "RdBu",  params$heatmap_palette)
axis_font_size  <- ifelse(is.null(params$axis_font_size),  0.85,    params$axis_font_size)
show_coef       <- ifelse(is.null(params$show_coef),       TRUE,    params$show_coef)
plot_title      <- ifelse(is.null(params$plot_title),      "",      params$plot_title)
n               <- ifelse(is.null(params$n),               0,       params$n)

heatmap_title <- ifelse(nchar(plot_title) > 0, plot_title,
                        paste0(toupper(method), " Correlation Heatmap"))

palette_map <- list(
  RdBu       = colorRampPalette(c("#d73027","#f46d43","#fdae61","#ffffff","#74add1","#4575b4"))(200),
  PRGn       = colorRampPalette(c("#762a83","#af8dc3","#f7f7f7","#7fbf7b","#1b7837"))(200),
  PiYG       = colorRampPalette(c("#c51b7d","#e9a3c9","#f7f7f7","#a1d76a","#4d9221"))(200),
  Colorblind = colorRampPalette(c("#0072B2","#56B4E9","#ffffff","#E69F00","#D55E00"))(200),
  Greyscale  = colorRampPalette(c("#000000","#888888","#ffffff"))(200),
  Blues      = colorRampPalette(c("#f7fbff","#6baed6","#08306b"))(200)
)
col_palette <- if (!is.null(palette_map[[heatmap_palette]])) palette_map[[heatmap_palette]] else palette_map[["RdBu"]]

p <- nrow(cor_mat)

layout(matrix(c(1, 2), nrow = 2), heights = c(0.88, 0.12))
png(file.path(output_dir, "correlation_heatmap.png"), width = 1000, height = 920, res = 120)

layout(matrix(c(1, 2), nrow = 2), heights = c(0.88, 0.12))

par(mar = c(0, 0, 2, 0))
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
  p.mat       = p_mat,
  sig.level   = c(0.001, 0.01, 0.05),
  insig       = "blank",
  title       = heatmap_title,
  mar         = c(0, 0, 2, 0)
)

par(mar = c(0, 2, 0, 2))
plot.new()
text(0.5, 0.6,
  paste0("Significance: * p < 0.05   ** p < 0.01   *** p < 0.001   (", toupper(method), " correlation, n = ", n, ")"),
  cex = 0.82, col = "#444444", adj = 0.5)

dev.off()

cat(toJSON(list(status = "success", heatmap_file = "correlation_heatmap.png"), auto_unbox = TRUE))
