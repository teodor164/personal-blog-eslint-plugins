"use strict";

const path = require('path')
const {isPathRelative} = require("../helpers");
const micromatch = require('micromatch')

module.exports = {
  meta: {
    type: null,
    docs: {
      description: "feature sliced relative path checker",
      category: "Fill me in",
      recommended: false,
      url: null,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          alias: {
            type: 'string'
          },
          ignoreImportPatterns: {
            type: 'array'
          }
        }
      }
    ],
  },

  create(context) {
    const layers = {
      app: ['pages', 'widgets', 'features', 'shared', 'entities'],
      pages: ['widgets', 'features', 'shared', 'entities'],
      widgets: ['features', 'shared', 'entities'],
      features: ['shared', 'entities'],
      entities: ['shared', 'entities'],
      shared: ['shared'],
    }

    const availableLayers = ['entities', 'features', 'shared', 'pages', 'widgets']

    const {alias = '', ignoreImportPatterns = []} = context.options[0] ?? {}

    const getCurrentFileLayer = () => {
      const currentFilePath = context.getFilename()

      const normalizedPath  = path.toNamespacedPath(currentFilePath)
      const projectPath = normalizedPath.split('src')[1]
      const segments = projectPath.split('\\')

      return segments[1]
    }

    const getImportLayer = (importValue) => {
      const importPath = alias ? importValue.replace(`${alias}/`, '') : importValue
      const segments = importPath.split('/')

      return segments[0]
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value
        const importLayer = getImportLayer(importPath)
        const currentFileLayer = getCurrentFileLayer()

        if (isPathRelative(importPath)) {
          return
        }

        if (!availableLayers.includes(importLayer) || !availableLayers.includes(currentFileLayer)) {
          return
        }

        const isIgnored = ignoreImportPatterns.some((pattern) => {
          return micromatch.isMatch(importPath, pattern)
        })

        if (isIgnored) {
          return
        }

        if (!layers[currentFileLayer]?.includes(importLayer)) {
          context.report(node, 'Slice can use only below slices (shared, entities, features, widgets, pages, app)')
        }
      }
    };
  },
};
