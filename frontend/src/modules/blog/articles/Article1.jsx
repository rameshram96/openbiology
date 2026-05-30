/**
 * Article1.jsx — Example article
 *
 * HOW TO ADD A NEW ARTICLE:
 * 1. Copy this file, give it a unique filename (e.g. MyNewArticle.jsx)
 * 2. Update `metadata` below with your article details
 * 3. Write your article content inside the default export function
 * 4. Place the file in src/modules/blog/articles/
 * 5. Done — it automatically appears in the blog, search, and tag filter
 *
 * Wrap your entire article JSX in <div className="ob-article">
 * to get the OpenBiology article typography (headings, code, tables, etc.)
 */

export const metadata = {
  slug:        "multiplex-crispr-rice-nitrogen",
  title:       "Multiplex CRISPR/Cas9 for Nitrogen Use Efficiency in Rice",
  description:
    "A step-by-step walkthrough of designing a multiplex CRISPR/Cas9 strategy targeting OsDREB1C and nitrogen assimilation genes in rice, including PTG design, guide RNA selection, and T0 screening workflow.",
  tags:        ["CRISPR", "Plant Science", "Tutorial", "Genomics"],
  date:        "2025-05-15",
  author: {
    name:        "Ramesh R",
    affiliation: "Division of Plant Physiology, ICAR–IARI, New Delhi",
    photo:       "https://rameshram96.github.io/Ramesh-Ramasamy/profile.jpg",
  },
};

export default function Article() {
  return (
    <div className="ob-article">

      <h2>Introduction</h2>
      <p>
        Nitrogen use efficiency (NUE) is a critical target for sustainable rice
        production. The transcription factor <strong>OsDREB1C</strong> has
        recently been identified as a positive regulator of NUE, affecting both
        nitrogen uptake and remobilisation. Multiplex CRISPR/Cas9 allows
        simultaneous editing of multiple loci in a single transformation event,
        making it well suited for dissecting the complex regulatory networks
        controlling NUE.
      </p>

      <h2>Strategy Overview</h2>
      <p>
        Our multiplex approach uses a <strong>Polycistronic tRNA-gRNA (PTG)</strong>{" "}
        construct, following the Xie et al. (2015) framework. This allows
        expression of up to 8 guide RNAs from a single Pol III promoter, with
        tRNA sequences serving as spacers that are cleaved by endogenous RNase P
        and RNase Z.
      </p>

      <h3>Target Genes</h3>
      <ul>
        <li><code>OsDREB1C</code> — transcription factor, NUE regulator</li>
        <li><code>OsNRT1.1B</code> — nitrate transporter</li>
        <li><code>OsGS1;1</code> — glutamine synthetase isoform</li>
      </ul>

      <h2>Guide RNA Design</h2>
      <p>
        Guide RNAs were designed using CRISPOR targeting the first exon of each
        gene. Selection criteria:
      </p>
      <ol>
        <li>Doench 2016 on-target score &gt; 50</li>
        <li>No off-targets with fewer than 3 mismatches in the rice genome</li>
        <li>GC content between 40–70%</li>
        <li>Avoid runs of 4+ identical nucleotides</li>
      </ol>

      <h2>PTG Assembly</h2>
      <p>
        The PTG unit was assembled by Golden Gate cloning into the pRGEB32
        binary vector. Use the{" "}
        <strong>PTGprimerDesigner</strong> tool on OpenBiology to generate the
        overlapping primer sequences for each tRNA–gRNA spacer.
      </p>

      <blockquote>
        Tip: Design your gRNA spacers in the order they appear on the construct,
        not in genomic order. The endogenous processing is position-independent.
      </blockquote>

      <h2>T0 Screening Workflow</h2>
      <p>
        Callus transformation was performed using <em>Agrobacterium</em>{" "}
        EHA105. T0 plants were screened by:
      </p>

      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Target</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>PCR + Sanger</td><td>All 3 loci</td><td>Confirm editing</td></tr>
          <tr><td>Denaturation HPLC</td><td>OsDREB1C</td><td>Heteroduplex detection</td></tr>
          <tr><td>BioSafe Primer</td><td>Construct junctions</td><td>Biosafety verification</td></tr>
        </tbody>
      </table>

      <h2>Results Summary</h2>
      <p>
        Of 42 T0 plants screened, 19 (45.2%) showed editing at one or more
        target sites. Simultaneous triple editing was observed in 5 plants
        (11.9%). All edited plants showed normal phenotype under standard
        growth conditions.
      </p>

      <h2>Conclusion</h2>
      <p>
        The PTG-CRISPR strategy is highly effective for multiplex editing in
        rice. Combining OsDREB1C knockout with NUE-associated gene editing
        opens a route to improved nitrogen utilisation without yield penalty.
        T1 population analysis is ongoing.
      </p>

    </div>
  );
}
