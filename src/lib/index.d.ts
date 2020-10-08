export interface DefaultExports extends Function {
  <TResult = any>(
    schema: AllSchema,
    input: PlainObject | PlainObject[]
  ): Output<TResult>;
  <TResult = any>(schema: AllSchema): (
    input: PlainObject | PlainObject[]
  ) => Output<TResult>;
}

declare const mapex: DefaultExports;

export default mapex;

export type Output<TResult> = { $result: TResult } & {
  [key: string]: EntityMap;
};

export interface EntityMap {
  [key: string]: PlainObject;
}

export interface PlainObject {
  [key: string]: any;
}

export type AllSchema = { $result: string } | { [key: string]: Schema };

export type Schema = SchemaAttributes & PropModifiers;

export interface SchemaAttributes {
  $extend?: string;
  $name?: string;
  $id?: string | IdSelector;
  $value?: string;
  $default?: string;
  $type?: string;
  $process?: Function;
  $merge?: Function;
  $desc?: CustomDescriptorFn | boolean;
}

export type IdSelector = (entity?: any) => any;

export type CustomDescriptorFn = (
  id?: any,
  schema?: string,
  entity?: any
) => string | [string, any];

export interface PropModifiers {
  [key: string]: NamedSchema | CustomProp | OmitProp | NoChangeProp;
}

export type OmitProp = false;

export type NoChangeProp = true;

export type NamedSchema = string;

export type CustomProp = Function;
