﻿///<reference path="./jaydata.d.ts" />

/*//////////////////////////////////////////////////////////////////////////////////////
////// Autogenerated by JaySvcUtil.exe http://JayData.org for more info        /////////
//////                      oData  V2  TypeScript                              /////////
//////////////////////////////////////////////////////////////////////////////////////*/


declare module LostContext {
  export class Servicex extends $data.Entity {
    constructor();
    constructor(initData: { ID?: string; ServiceID?: string; Expires?: Date; LastUpdated?: Date; DisplayName?: string; Description?: string; LanguageCode?: string; ServiceURN?: string; URIs?: LostContext.ServiceURI[]; Numbers?: LostContext.ServiceNumber[]; Boundaries?: LostContext.ServiceBoundary[]; });
    ID: string;
    ServiceID: string;
    Expires: Date;
    LastUpdated: Date;
    DisplayName: string;
    Description: string;
    LanguageCode: string;
    ServiceURN: string;
    URIs: LostContext.ServiceURI[];
    Numbers: LostContext.ServiceNumber[];
    Boundaries: LostContext.ServiceBoundary[];
    
  }
  
  export class ServiceURI extends $data.Entity {
    constructor();
    constructor(initData: { ID?: string; Schema?: string; URI?: string; Service?: LostContext.Servicex; });
    ID: string;
    Schema: string;
    URI: string;
    Service: LostContext.Servicex;
    
  }
  
  export class ServiceNumber extends $data.Entity {
    constructor();
    constructor(initData: { ID?: string; Number?: string; Service?: LostContext.Servicex; });
    ID: string;
    Number: string;
    Service: LostContext.Servicex;
    
  }
  
  export class ServiceBoundary extends $data.Entity {
    constructor();
    constructor(initData: { ID?: string; BoundaryGeom?: $data.GeographyMultiPolygon; Service?: LostContext.Servicex; });
    ID: string;
    BoundaryGeom: $data.GeographyMultiPolygon;
    Service: LostContext.Servicex;
    
  }
  
  export class Service extends $data.EntityContext {
    onReady(): $data.IPromise;
    onReady(handler: (context: Service) => void): $data.IPromise;
    
    Services: $data.EntitySet<LostContext.Servicex>;
    ServiceURIs: $data.EntitySet<LostContext.ServiceURI>;
    ServiceNumbers: $data.EntitySet<LostContext.ServiceNumber>;
    ServiceBoundaries: $data.EntitySet<LostContext.ServiceBoundary>;
    
  }

}
