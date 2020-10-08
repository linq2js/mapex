const defaultKeySelector = (entity) => entity.id;
const defaultProcess = (entity) => ({ ...entity });
const defaultContext = {};
const omit = {};
const defaultMerge = (a, b) => ({ ...a, ...b });

export default function mapex(schema) {
  if (arguments.length > 1) {
    return mapex(schema)(arguments[1]);
  }
  const { $result, ...types } = schema;
  const typeMap = {};
  const typeArray = Object.entries(types)
    .map(([type, { $extend, ...definition }]) => {
      if ($extend) {
        if (!schema[$extend]) throw new Error("Schema not found: " + $extend);
        Object.assign(definition, schema[$extend]);
      }
      const {
        // output prop name
        $name,
        // key name
        $id,
        $value,
        // union type
        $type,
        $desc,
        $default,
        $merge = defaultMerge,
        $process = defaultProcess,
        ...subTypeMap
      } = definition;
      const name = $name || type;
      const key =
        $id === false
          ? undefined
          : typeof $id === "function"
          ? $id
          : !$id
          ? defaultKeySelector
          : (entity) => entity[$id];
      const subTypeArray = Object.entries(subTypeMap).map(([key, value]) => {
        const multiple = Array.isArray(value);
        let subTypeName = multiple ? value[0] : value;
        if (subTypeName === "this") {
          subTypeName = type;
        }

        const subType = {
          map(entity) {
            if (subTypeName === true) {
              return entity;
            }
            if (subTypeName === false) {
              return omit;
            }
            if (typeof subTypeName === "function") {
              return subTypeName(...arguments);
            }
            return typeMap[subTypeName].map(...arguments);
          },

          multiple,
        };
        subTypeMap[key] = subType;
        return [key, subType];
      });

      function addEntity(output, key, entity) {
        const collection = output[name];
        const existing = collection[key];
        if (existing && typeof existing === "object") {
          collection[key] = $merge(entity, collection[key]);
        } else {
          collection[key] = entity;
        }
      }

      function map(entity, output, context) {
        // is union type
        if ($type) {
          let subType = entity[$type];
          if (!subType) {
            // fallback
            subType = $default;
          }

          if ($desc && key) {
            let genericId = key(entity);
            if (typeof $desc === "function") {
              genericId = $desc(genericId, subType, entity);
            }
            if (Array.isArray(genericId)) {
              addEntity(output, genericId[0], genericId[1]);
            } else {
              addEntity(output, genericId, subType);
            }
          }

          if (subType in subTypeMap) {
            return subTypeMap[subType].map(entity, output, context);
          } else if ($default) {
            return typeMap[$default].map(entity, output, context);
          }
          throw new Error("Invalid union type mapping: " + subType);
        }

        if (!entity) return entity;

        if ($value) {
          const cloned = {};
          Object.entries(entity).forEach(([prop, value]) => {
            cloned[prop] = typeMap[$value].map(value, output, {
              prop,
              parent: entity,
            });
          });
          return cloned;
        }

        const cloned = $process(entity);

        subTypeArray.forEach(([prop, subType]) => {
          const value = subType.map(entity[prop], output, {
            prop,
            parent: entity,
          });
          if (value === omit) {
            delete cloned[prop];
          } else {
            cloned[prop] = value;
          }
        });

        if (key) {
          const id = key(entity);
          addEntity(output, id, cloned);
          return id;
        } else {
          return cloned;
        }
      }

      return (typeMap[type] = {
        name: ($type && !$desc) || $id === false ? undefined : name,
        map(entity, output, context = defaultContext) {
          if (Array.isArray(entity)) {
            return entity.map((x) => map(x, output, context));
          }
          if (typeof entity === "undefined") return omit;
          return map(entity, output, context);
        },
      });
    })
    .filter((x) => x);

  return function (data) {
    const output = {};
    typeArray.forEach((type) => {
      if (type.name && type.name.charAt(0) !== "_") {
        output[type.name] = {};
      }
    });
    if (!$result) throw new Error("$result schema required");
    Object.defineProperty(output, "$result", {
      value: typeMap[$result].map(data, output),
      enumerable: false,
    });
    return output;
  };
}
