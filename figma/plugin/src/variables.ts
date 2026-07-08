// Reproduces tokens.collections[] as Figma Variable Collections.
// Two passes: (1) create every collection, mode, and variable so all ids exist;
// (2) set valuesByMode, resolving VARIABLE_ALIAS against the full registry.
// Registry (token id -> Variable) is returned for component token bindings.

import type { CollectionDef, ModeValue, VariableDef } from './types';
import { log, progress, warn } from './log';

export type VariableRegistry = Map<string, Variable>;

interface Created {
  def: VariableDef;
  variable: Variable;
  modeIdByName: Record<string, string>;
}

function ensureModes(collection: VariableCollection, modes: string[]): Record<string, string> {
  const byName: Record<string, string> = {};
  // A new collection starts with one default mode — rename it to the first.
  collection.renameMode(collection.modes[0].modeId, modes[0]);
  byName[modes[0]] = collection.modes[0].modeId;
  for (let i = 1; i < modes.length; i++) {
    byName[modes[i]] = collection.addMode(modes[i]);
  }
  return byName;
}

function applyValue(
  variable: Variable,
  modeId: string,
  mv: ModeValue,
  registry: VariableRegistry,
): void {
  switch (mv.type) {
    case 'COLOR':
      variable.setValueForMode(modeId, mv.rgba);
      break;
    case 'FLOAT':
    case 'STRING':
    case 'BOOLEAN':
      variable.setValueForMode(modeId, mv.value);
      break;
    case 'VARIABLE_ALIAS': {
      const target = registry.get(mv.aliasId);
      if (!target) {
        warn(`Unresolved alias ${mv.aliasName} (${mv.aliasId}) on ${variable.name}`);
        return;
      }
      variable.setValueForMode(modeId, { type: 'VARIABLE_ALIAS', id: target.id });
      break;
    }
  }
}

export function buildVariables(collections: CollectionDef[]): VariableRegistry {
  const registry: VariableRegistry = new Map();
  const created: Created[] = [];

  // Pass 1 — collections, modes, variables (values not set yet).
  for (const col of collections) {
    const collection = figma.variables.createVariableCollection(col.name);
    const modeIdByName = ensureModes(collection, col.modes);
    for (const def of col.variables) {
      const variable = figma.variables.createVariable(def.name, collection, def.figmaType);
      variable.scopes = def.scopes as VariableScope[];
      if (def.description) variable.description = def.description;
      registry.set(def.id, variable);
      created.push({ def, variable, modeIdByName });
    }
    log(
      `Collection "${col.name}": ${col.variables.length} variables, modes [${col.modes.join(', ')}]`,
    );
  }

  // Pass 2 — resolve every value/alias now that all ids exist.
  let i = 0;
  for (const { def, variable, modeIdByName } of created) {
    for (const [modeName, mv] of Object.entries(def.valuesByMode)) {
      const modeId = modeIdByName[modeName];
      if (!modeId) {
        warn(`Variable ${def.name}: unknown mode "${modeName}"`);
        continue;
      }
      applyValue(variable, modeId, mv, registry);
    }
    if (++i % 64 === 0)
      progress(0.05 + 0.2 * (i / created.length), `Variables ${i}/${created.length}`);
  }

  return registry;
}
