// HEADY_BRAND:BEGIN
// ╔══════════════════════════════════════════════════════════════════╗
// ║  HeadyIO.com — Site-specific Eleventy configuration             ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END

module.exports = function(eleventyConfig) {
  // HeadyIO-specific overrides
  eleventyConfig.addPassthroughCopy('assets');

  return {
    dir: {
      input: '.',
      output: '../../_dist/headyio.com',
    },
  };
};
