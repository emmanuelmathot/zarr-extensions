**`geo:proj` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**version**|`string`|Version of the geo:proj extension being used| &#10003; Yes|
|**code**|`["string", "null"]`|Authority:code identifier (e.g., EPSG:4326)|No|
|**wkt2**|`["string", "null"]`|WKT2 (ISO 19162) CRS representation|No|
|**projjson**|`["object", "null"]`|PROJJSON CRS representation|No|
|**bbox**|`number` `[]`|Bounding box in CRS coordinates|No|
|**transform**|`number` `[]`|Affine transformation coefficients|No|
|**spatial_dimensions**|`string` `[2]`|Names of spatial dimensions [y_name, x_name]|No|


###### geo:proj.version

Version of the geo:proj extension being used

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"1.0"`

###### geo:proj.code

Authority:code identifier (e.g., EPSG:4326)

* **Type**: `["string", "null"]`
* **Required**: No
* **Pattern**: `^[A-Z]+:[0-9]+$`

###### geo:proj.wkt2

WKT2 (ISO 19162) CRS representation

* **Type**: `["string", "null"]`
* **Required**: No

###### geo:proj.projjson

PROJJSON CRS representation

* **Type**: `["object", "null"]`
* **Required**: No

###### geo:proj.bbox

Bounding box in CRS coordinates

* **Type**: `number` `[]`
* **Required**: No

###### geo:proj.transform

Affine transformation coefficients

* **Type**: `number` `[]`
* **Required**: No

###### geo:proj.spatial_dimensions

Names of spatial dimensions [y_name, x_name]

* **Type**: `string` `[2]`
* **Required**: No