import type { Asset } from "../types/asset";
import {
    listOwnedAssets,
} from "../repositories/asset-repository";


export async function getOwnedAssets(userId: string): Promise<Asset[]> {
    return listOwnedAssets(userId);
}