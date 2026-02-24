export interface WbBoxTariffWarehouse {
  warehouseId: number;
  warehouseName: string;

  boxDeliveryCoefExpr?: number;
  boxDeliveryCoefBase?: number;

  boxStorageCoefExpr?: number;
  boxStorageCoefBase?: number;
}

export interface WbBoxTariffsApiData {
  warehouseList: WbBoxTariffWarehouse[];
}

export interface WbBoxTariffsResponse {
  response: {
    data: WbBoxTariffsApiData;
  };
}