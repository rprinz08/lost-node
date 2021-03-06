﻿

/*//////////////////////////////////////////////////////////////////////////////////////
////// Autogenerated by JaySvcUtil.exe http://JayData.org for more info        /////////
//////                             oData  V2                                     /////////
//////////////////////////////////////////////////////////////////////////////////////*/
(function(global, $data, undefined) {

    
  $data.Entity.extend('LostContext.Servicex', {
     'ID': { 'key':true,'nullable':false,'computed':true,'type':'Edm.String' },
     'ServiceID': { 'nullable':false,'required':true,'type':'Edm.String' },
     'Expires': { 'nullable':false,'required':true,'type':'Edm.DateTime' },
     'LastUpdated': { 'nullable':false,'required':true,'type':'Edm.DateTime' },
     'DisplayName': { 'nullable':false,'required':true,'type':'Edm.String' },
     'Description': { 'maxLength':Number.POSITIVE_INFINITY,'type':'Edm.String' },
     'LanguageCode': { 'nullable':false,'required':true,'type':'Edm.String' },
     'URN': { 'nullable':false,'required':true,'type':'Edm.String' },
     'URIs': { 'type':'Array','elementType':'LostContext.ServiceURI','inverseProperty':'SVC' },
     'Numbers': { 'type':'Array','elementType':'LostContext.ServiceNumber','inverseProperty':'SVC' },
     'Boundaries': { 'type':'Array','elementType':'LostContext.ServiceBoundary','inverseProperty':'SVC' }
  });

  $data.Entity.extend('LostContext.ServiceURI', {
     'ID': { 'key':true,'nullable':false,'computed':true,'type':'Edm.String' },
     'Schema': { 'nullable':false,'required':true,'type':'Edm.String' },
     'URI': { 'nullable':false,'required':true,'type':'Edm.String' },
     'ServiceID': { 'nullable':false,'required':true,'type':'Edm.String' },
     'SVC': { 'type':'LostContext.Servicex','inverseProperty':'URIs' }
  });

  $data.Entity.extend('LostContext.ServiceNumber', {
     'ID': { 'key':true,'nullable':false,'computed':true,'type':'Edm.String' },
     'Number': { 'nullable':false,'required':true,'type':'Edm.String' },
     'ServiceID': { 'nullable':false,'required':true,'type':'Edm.String' },
     'SVC': { 'type':'LostContext.Servicex','inverseProperty':'Numbers' }
  });

  $data.Entity.extend('LostContext.ServiceBoundary', {
     'ID': { 'key':true,'nullable':false,'computed':true,'type':'Edm.String' },
     'BoundaryGeom': { 'nullable':false,'required':true,'type':'Edm.GeographyMultiPolygon' },
     'ReferenceID': { 'nullable':false,'required':true,'type':'Edm.String' },
     'ServiceID': { 'nullable':false,'required':true,'type':'Edm.String' },
     'SVC': { 'type':'LostContext.Servicex','inverseProperty':'Boundaries' }
  });

  $data.EntityContext.extend('LostContext.Service', {
     'SVCs': { type: $data.EntitySet, elementType: LostContext.Servicex},
     'ServiceURIs': { type: $data.EntitySet, elementType: LostContext.ServiceURI},
     'ServiceNumbers': { type: $data.EntitySet, elementType: LostContext.ServiceNumber},
     'ServiceBoundaries': { type: $data.EntitySet, elementType: LostContext.ServiceBoundary},
     'getServiceURIs': { type: $data.ServiceOperation, method: 'GET', returnType: $data.Queryable, elementType: 'LostContext.ServiceURI', params: [] },
     'getServiceNumbers': { type: $data.ServiceOperation, method: 'GET', returnType: $data.Queryable, elementType: 'LostContext.ServiceNumber', params: [] },
     'getURNs': { type: $data.ServiceOperation, method: 'GET', returnType: $data.Queryable, elementType: 'Edm.String', params: [] }
  });

  $data.generatedContexts = $data.generatedContexts || [];
  $data.generatedContexts.push(LostContext.Service);
  
      
})(window, $data);
      
    