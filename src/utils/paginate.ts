// src/utils/paginate.ts
import { FindAndCountOptions, Model } from "sequelize";
import { Pagination } from "../middleware";

export async function paginate<T extends Model>(
  model: any,
  options: FindAndCountOptions,
  pagination: Pagination
) {
  const { page, limit, offset } = pagination;

  const { rows, count } = await model.findAndCountAll({
    ...options,
    limit,
    offset,
  });

  return {
    data: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}
