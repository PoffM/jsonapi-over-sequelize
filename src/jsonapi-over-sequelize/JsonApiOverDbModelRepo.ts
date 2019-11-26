import { EXPECTED_OPTIONS_KEY } from "dataloader-sequelize";
import { DocWithData, ResourceObject } from "jsonapi-typescript";
import { uniqWith } from "lodash";
import { Model } from "sequelize";
import { getRequestContext } from "../requestContext";
import { getSequelizeSort } from "./sorting";
import { JsonApiOverDbModelConfig, QueryParams } from "./types";

export class JsonApiOverDbModelRepo<
  TResource extends ResourceObject,
  TModel extends Model
> {
  public config: JsonApiOverDbModelConfig<TResource, TModel>;

  constructor(config: JsonApiOverDbModelConfig<TResource, TModel>) {
    this.config = config;
  }

  public async findAll(
    params: QueryParams = {}
  ): Promise<DocWithData<Array<TResource>>> {
    const { dbRepo } = this.config;
    const context = getRequestContext();

    const sort = params.sort
      ? getSequelizeSort(this.config.dbRepo, params.sort)
      : undefined;

    const dbModels: TModel[] = await dbRepo.findAll({
      include: sort?.sortIncludes ?? [],
      limit: params.page?.limit ?? 20,
      offset: params.page?.offset ?? 0,
      order: sort?.sortOrders ?? [],
      [EXPECTED_OPTIONS_KEY]: context?.sequelizeContext
    });

    const data = await Promise.all(
      dbModels.map(model => this.modelToResource(model))
    );

    const doc: DocWithData<Array<TResource>> = {
      data,
      meta: {
        sqlLogs: context?.sqlLogs ?? null
      }
    };

    if (params.include && this.config.includeResolvers) {
      doc.included = await this.getIncluded(params.include, dbModels);
    }

    return doc;
  }

  public async findOne(
    id: string,
    params: QueryParams = {}
  ): Promise<DocWithData<TResource>> {
    const { dbRepo } = this.config;
    const context = getRequestContext();

    const dbModel: TModel = await dbRepo.findByPk(Number(id), {
      [EXPECTED_OPTIONS_KEY]: context?.sequelizeContext
    });

    const data = await this.modelToResource(dbModel);

    const doc: DocWithData<TResource> = {
      data,
      meta: {
        sqlLogs: context?.sqlLogs ?? null
      }
    };

    if (params.include) {
      doc.included = await this.getIncluded(params.include, [dbModel]);
    }

    return doc;
  }

  private async getIncluded(
    includeParam: string,
    dbModels: TModel[]
  ): Promise<Array<ResourceObject>> {
    const includedPromises: Array<Promise<ResourceObject | null>> = [];
    const includePaths = includeParam.split(",");
    for (const path of includePaths) {
      for (const model of dbModels) {
        const resolver = this.config.includeResolvers?.[path];
        if (resolver) {
          includedPromises.push(resolver(model));
        }
      }
    }
    const includedWithDuplicatesAndNulls = await Promise.all(includedPromises);

    // Don't include null associations:
    const includedWithDuplicates: Array<ResourceObject> = [];
    for (const i of includedWithDuplicatesAndNulls) {
      i && includedWithDuplicates.push(i);
    }

    const includedUnique = uniqWith(
      includedWithDuplicates,
      (a, b) => a.type === b.type && a.id === b.id
    );

    return includedUnique;
  }

  private async modelToResource(model: TModel): Promise<TResource> {
    const { attributeResolvers, typeName } = this.config;

    const attributes: any = {};

    for (const attr in attributeResolvers) {
      const resolver = attributeResolvers[attr];
      if (typeof resolver === "string") {
        attributes[attr] = model[resolver as string];
      }
      if (typeof resolver === "function") {
        attributes[attr] = await (resolver as any)(model);
      }
    }

    return { attributes, id: String((model as any).id), type: typeName } as any;
  }
}
