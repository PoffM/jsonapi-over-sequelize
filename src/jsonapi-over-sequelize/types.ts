import { ResourceObject, AttributesObject } from "jsonapi-typescript";
import { Model } from "sequelize";
import { DbRepo } from "../models";

export interface JsonApiOverDbModelConfig<
  TResource extends ResourceObject,
  TModel extends Model
> {
  typeName: TypeNameOf<TResource>;
  dbRepo: DbRepo<TModel>;
  attributeResolvers: AttributeResolvers<TModel, AttributesOf<TResource>>;
  includeResolvers?: IncludeResolvers<TModel>;
}

export type AttributesOf<Type extends ResourceObject> = Type extends ResourceObject<
  any,
  infer TAttributes
>
  ? TAttributes
  : never;

export type TypeNameOf<Type extends ResourceObject> = Type extends ResourceObject<
  infer TTypeName
>
  ? TTypeName
  : never;

export type AttributeResolvers<
  TModel extends Model,
  TAttributes extends AttributesObject
> = {
  [P in keyof TAttributes]: AttributeResolver<TModel, TAttributes, P>;
};

export type AttributeResolver<
  TModel extends Model,
  TAttributes extends AttributesObject,
  P extends keyof TAttributes
> =
  | keyof TModel
  | ((model: TModel) => TAttributes[P] | Promise<TAttributes[P]>);

export interface IncludeResolvers<TModel extends Model> {
  [key: string]: IncludeResolver<TModel>;
}

export type IncludeResolver<TModel extends Model> = (
  resource: TModel
) => Promise<ResourceObject | null>;

export interface LimitOffsetPageSpec {
  limit?: number;
  offset?: number;
}

export interface QueryParams {
  include?: string;
  page?: LimitOffsetPageSpec;
  sort?: string;
}
