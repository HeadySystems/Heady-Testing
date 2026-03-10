// HEADY_BRAND:BEGIN
// ╔══════════════════════════════════════════════════════════════════╗
// ║  ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                     ║
// ║  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                     ║
// ║  ███████║█████╗  ███████║██║  ██║ ╚████╔╝                      ║
// ║  ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                       ║
// ║  ██║  ██║███████╗██║  ██║██████╔╝   ██║                        ║
// ║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                        ║
// ║                                                                  ║
// ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces    ║
// ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
// ║  FILE: src/routes/imagination-routes.js                                                    ║
// ║  LAYER: routing                                                  ║
// ║  PURPOSE: Imagination Engine REST API                            ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END

const express = require('express');
const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════════
// LOAD IMAGINATION ENGINE MODULES (with graceful fallback)
// ═════════════════════════════════════════════════════════════════════════════

let imagination = null;
let imaginationLLM = null;
let imaginationPatternIntegration = null;

try {
  const { imagination: img } = require('../hc_imagination');
  imagination = img;
} catch (e) {
  console.warn('[Routes] Imagination Engine not available:', e.message);
}

try {
  const { imaginationLLM: llm } = require('../hc_imagination_llm');
  imaginationLLM = llm;
} catch (e) {
  console.warn('[Routes] Imagination LLM Integration not available:', e.message);
}

try {
  const { imaginationPatternIntegration: patInteg } = require('../hc_imagination_pattern_integration');
  imaginationPatternIntegration = patInteg;
} catch (e) {
  console.warn('[Routes] Imagination Pattern Integration not available:', e.message);
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Check if Imagination Engine is initialized
 */
function ensureInitialized() {
  if (!imagination || !imagination.initialized) {
    return false;
  }
  return true;
}

/**
 * Create standard error response
 */
function errorResponse(res, statusCode, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details })
  });
}

/**
 * Create standard success response
 */
function successResponse(res, statusCode, data = {}) {
  return res.status(statusCode).json({
    success: true,
    ...data
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /status
 * Get imagination engine status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    if (!imagination) {
      return errorResponse(res, 503, 'Imagination Engine not loaded');
    }

    // Initialize if needed
    if (!imagination.initialized) {
      await imagination.init();
    }

    const stats = imagination.getStats();

    return successResponse(res, 200, {
      message: 'Imagination Engine status',
      initialized: imagination.initialized,
      stats,
      llmEnabled: imaginationLLM?.enabled || false,
      patternIntegrationEnabled: imaginationPatternIntegration?.enabled || false
    });
  } catch (err) {
    console.error('[Routes] /status error:', err);
    return errorResponse(res, 500, 'Failed to get status', {
      error: err.message
    });
  }
});

/**
 * POST /generate
 * Generate new concepts through imagination cycle
 * Body: { batchSize?: number }
 */
router.post('/generate', async (req, res) => {
  try {
    if (!imagination) {
      return errorResponse(res, 503, 'Imagination Engine not loaded');
    }

    // Initialize if needed
    if (!imagination.initialized) {
      await imagination.init();
    }

    const { batchSize } = req.body || {};
    const concepts = await imagination.imagine(batchSize);

    return successResponse(res, 201, {
      message: 'Concepts generated successfully',
      count: concepts.length,
      concepts: concepts.map(c => ({
        id: c.id,
        title: c.title,
        summary: c.summary,
        status: c.status,
        scores: c.scores,
        recombination_op: c.recombination_op
      }))
    });
  } catch (err) {
    console.error('[Routes] /generate error:', err);
    return errorResponse(res, 500, 'Failed to generate concepts', {
      error: err.message
    });
  }
});

/**
 * POST /expand
 * Expand/elaborate on a specific concept
 * Body: { conceptId: string, elaborationDepth?: number }
 */
router.post('/expand', async (req, res) => {
  try {
    if (!imagination) {
      return errorResponse(res, 503, 'Imagination Engine not loaded');
    }

    if (!imagination.initialized) {
      await imagination.init();
    }

    const { conceptId, elaborationDepth } = req.body || {};

    if (!conceptId) {
      return errorResponse(res, 400, 'Missing required field: conceptId');
    }

    const concept = imagination.concepts.get(conceptId);
    if (!concept) {
      return errorResponse(res, 404, 'Concept not found');
    }

    // Expand by applying operators to the base concept
    const depth = elaborationDepth || 1;
    const expanded = [];

    for (let i = 0; i < depth; i++) {
      const operator = imagination.selectOperator();
      let newConcept = null;

      switch (operator) {
        case 'EXTEND': {
          const prims = imagination.selectPrimitives(1);
          if (prims.length > 0) {
            newConcept = imagination.extend(concept, prims[0]);
          }
          break;
        }
        case 'SUBSTITUTE': {
          const prims = imagination.selectPrimitives(1);
          if (prims.length > 0) {
            newConcept = imagination.substitute(concept, prims[0]);
          }
          break;
        }
        case 'MORPH': {
          const other = imagination.selectExistingConcept();
          if (other && other.id !== conceptId) {
            newConcept = imagination.morph(concept, other, Math.random());
          }
          break;
        }
        default:
          break;
      }

      if (newConcept) {
        await imagination.evaluateConcept(newConcept);
        expanded.push(newConcept);
      }
    }

    await imagination.saveConcepts();

    return successResponse(res, 200, {
      message: 'Concept expanded successfully',
      base_concept: {
        id: concept.id,
        title: concept.title,
        status: concept.status
      },
      elaborations_count: expanded.length,
      elaborations: expanded.map(c => ({
        id: c.id,
        title: c.title,
        summary: c.summary,
        status: c.status,
        scores: c.scores,
        recombination_op: c.recombination_op
      }))
    });
  } catch (err) {
    console.error('[Routes] /expand error:', err);
    return errorResponse(res, 500, 'Failed to expand concept', {
      error: err.message
    });
  }
});

/**
 * GET /patterns
 * Get active patterns and concept-pattern correlations
 */
router.get('/patterns', async (req, res) => {
  try {
    if (!imagination) {
      return errorResponse(res, 503, 'Imagination Engine not loaded');
    }

    if (!imagination.initialized) {
      await imagination.init();
    }

    const patterns = [];

    // Get emerging patterns from concept analysis
    if (imaginationPatternIntegration) {
      const emerging = imaginationPatternIntegration.detectEmergingPatterns();
      patterns.push(...emerging);
    }

    // Get hot concept patterns
    const hotConcepts = imagination.getHotConcepts();
    const hotPatterns = hotConcepts.map(c => ({
      type: 'hot_concept',
      id: c.id,
      title: c.title,
      novelty: c.scores.novelty,
      usefulness: c.scores.usefulness
    }));

    return successResponse(res, 200, {
      message: 'Imagination patterns',
      hot_concepts: hotPatterns,
      emerging_patterns: patterns
    });
  } catch (err) {
    console.error('[Routes] /patterns error:', err);
    return errorResponse(res, 500, 'Failed to get patterns', {
      error: err.message
    });
  }
});

/**
 * POST /integrate
 * Integrate pattern insights with imagination engine
 * Body: { conceptId?: string, updateOperatorStats?: boolean }
 */
router.post('/integrate', async (req, res) => {
  try {
    if (!imagination) {
      return errorResponse(res, 503, 'Imagination Engine not loaded');
    }

    if (!imagination.initialized) {
      await imagination.init();
    }

    const { conceptId, updateOperatorStats } = req.body || {};
    const results = {
      message: 'Integration completed',
      actions: []
    };

    // Cross-reference hot concepts with patterns
    if (imaginationPatternIntegration?.enabled) {
      const correlations = await imaginationPatternIntegration.crossReferenceHotConcepts();
      results.actions.push({
        type: 'pattern_cross_reference',
        count: correlations.length,
        correlations: correlations.map(c => ({
          concept_id: c.concept_id,
          concept_title: c.concept_title,
          pattern_count: c.patterns.length
        }))
      });

      // Get pattern-guided suggestions
      const suggestions = imaginationPatternIntegration.getPatternGuidedSuggestions();
      results.actions.push({
        type: 'pattern_suggestions',
        count: suggestions.length,
        suggestions
      });
    }

    // Update operator statistics if requested
    if (updateOperatorStats) {
      const stats = imagination.operatorStats;
      results.actions.push({
        type: 'operator_stats',
        stats
      });
    }

    // Specific concept feedback
    if (conceptId) {
      const concept = imagination.concepts.get(conceptId);
      if (concept) {
        imagination.updatePrimitiveWeights(conceptId, true);
        await imagination.savePrimitives();

        results.actions.push({
          type: 'concept_feedback',
          concept_id: conceptId,
          message: 'Primitive weights updated based on concept success'
        });
      }
    }

    return successResponse(res, 200, results);
  } catch (err) {
    console.error('[Routes] /integrate error:', err);
    return errorResponse(res, 500, 'Failed to integrate patterns', {
      error: err.message
    });
  }
});

/**
 * GET /concepts/:id
 * Get detailed information about a specific concept
 */
router.get('/concepts/:id', async (req, res) => {
  try {
    if (!imagination) {
      return errorResponse(res, 503, 'Imagination Engine not loaded');
    }

    if (!imagination.initialized) {
      await imagination.init();
    }

    const concept = imagination.concepts.get(req.params.id);
    if (!concept) {
      return errorResponse(res, 404, 'Concept not found');
    }

    // Enrich concept with primitive details
    const primitives = concept.primitive_ids.map(id => {
      const prim = imagination.primitives.get(id);
      return prim ? {
        id: prim.id,
        kind: prim.kind,
        description: prim.description,
        tags: prim.tags
      } : null;
    }).filter(Boolean);

    return successResponse(res, 200, {
      message: 'Concept details',
      concept: {
        ...concept,
        primitives
      }
    });
  } catch (err) {
    console.error('[Routes] /concepts/:id error:', err);
    return errorResponse(res, 500, 'Failed to get concept', {
      error: err.message
    });
  }
});

/**
 * GET /top
 * Get top-scoring concepts
 * Query: { limit?: number, status?: string }
 */
router.get('/top', async (req, res) => {
  try {
    if (!imagination) {
      return errorResponse(res, 503, 'Imagination Engine not loaded');
    }

    if (!imagination.initialized) {
      await imagination.init();
    }

    const limit = parseInt(req.query.limit) || 10;
    const minStatus = req.query.status || 'raw';

    const topConcepts = imagination.getTopConcepts(limit, minStatus);

    return successResponse(res, 200, {
      message: 'Top concepts',
      count: topConcepts.length,
      concepts: topConcepts.map(c => ({
        id: c.id,
        title: c.title,
        summary: c.summary,
        status: c.status,
        scores: c.scores,
        compositeScore: c.compositeScore
      }))
    });
  } catch (err) {
    console.error('[Routes] /top error:', err);
    return errorResponse(res, 500, 'Failed to get top concepts', {
      error: err.message
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 404 handler for imagination routes
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Imagination Engine endpoint not found',
    path: req.path,
    method: req.method
  });
});

module.exports = router;
