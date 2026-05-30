/**
 * sponsor.js — Sponsor banner configuration
 *
 * HOW TO UPDATE THE BANNER:
 * 1. Replace public/sponsor/banner.jpg with your new image
 * 2. Set active: true
 * 3. Set link to the sponsor URL (or "" for no hyperlink)
 * 4. Push to GitHub — banner updates automatically on redeploy
 *
 * HOW TO HIDE THE BANNER (show fallback):
 * Set active: false and push.
 *
 * RECOMMENDED IMAGE SIZE: 1200 × 320 px, JPG or PNG, under 2 MB
 */

const sponsor = {
  active: true,                    // true = show banner, false = show fallback
  image:  "/sponsor/banner.jpg",    // path inside public/ folder
  link:   "",                       // sponsor URL, or "" for no hyperlink
};

export default sponsor;
