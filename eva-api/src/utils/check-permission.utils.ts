import { RequestContext } from "~/modules/users/user.type";
import { AppError } from "./app-error.utils";

export const checkPermission = (ctx: RequestContext, permission: string) => {
  if(!ctx.permissions.includes(permission)) throw new AppError(`Permission denied: ${permission}`, 403);
}

export default checkPermission;
