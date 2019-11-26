import { Includeable, Model, Order, IncludeOptions } from "sequelize";
import { DbRepo } from "../models";

export function getSequelizeSort(model: DbRepo<Model>, sortParam: string) {
  const sortStrings = sortParam.split(",");
  const sortOrders = sortStrings.map(sortString => {
    let sortPath = sortString;
    let direction = "ASC";
    if (["+", "-"].includes(sortString.charAt(0))) {
      sortPath = sortString.substring(1);
      direction = sortString.charAt(0) === "-" ? "DESC" : "ASC";
    }

    return [...sortPath.split("."), direction];
  });

  const sortIncludes = sortOrders
    .filter(o => o.length > 2)
    .map(sortOrder => getIncludeFromPath(model, sortOrder.slice(0, -2)));

  return {
    sortIncludes,
    sortOrders: sortOrders as Order
  };
}

function getIncludeFromPath(
  model: DbRepo<Model>,
  associationPath: string[]
): IncludeOptions {
  const [associationKey, ...restOfPath] = associationPath;
  const association = model.associations[associationKey];
  if (!association) {
    throw new Error(`Association ${associationKey} not found.`)
  }
  return {
    attributes: [],
    association,
    include: restOfPath.length
      ? [getIncludeFromPath(association.target, restOfPath)]
      : []
  };
}
