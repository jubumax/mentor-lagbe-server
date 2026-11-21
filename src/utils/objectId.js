import { ObjectId } from "mongodb";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function toObjectId(value) {
    return typeof value === "string" && OBJECT_ID_PATTERN.test(value)
        ? new ObjectId(value)
        : null;
}