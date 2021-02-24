import { GraphQLScalarType, Kind } from 'graphql';

export const ObjectType = new GraphQLScalarType({
  name: 'Object',
  description: 'Represents an arbitrary object',
  parseValue: toObject,
  serialize: toObject,
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        return ast.value.charAt(0) === '{' ? JSON.parse(ast.value) : null;
      case Kind.OBJECT:
        return parseObject(ast);
    }
    return null;
  },
});

function toObject(value: any) {
  if (typeof value === 'object') {
    return value;
  }
  if (typeof value === 'string' && value.charAt(0) === '{') {
    return JSON.parse(value);
  }
  return null;
}

function parseObject(ast: any) {
  const value = Object.create(null);
  ast.fields.forEach((field: any) => {
    value[field.name.value] = parseAst(field.value);
  });
  return value;
}

function parseAst(ast: any) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(ast);
    case Kind.LIST:
      return ast.values.map(parseAst);
    default:
      return null;
  }
}
