# Export manager API (v1)

## Introduction

This document describes the user management API endpoints for version 1 (v1).

## Base URL

`/api/v1`

## Authentication

Authentication is required for data management endpoints. We using session-based approach.

## Endpoints

### Login

- Path: `/api/v1/login`
- Method: POST
- Body(raw):

```json
    {
      username: string,
      password: string
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {}
	}
```

### Logout

- Path: `/api/v1/logout`
- Method: POST

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {}
	}
```

### Create account

- Path: `/api/v1/user`
- Method: POST
- Body(raw):

```json
    {
      username: string,
      password: string,
	  displayName: string,
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {
			id: string,
			role: number,
			username: string,
			password: string,
			displayName: string,
		}
	}
```

### Update account

- Path: `/api/v1/user/:id`
- Method: PATCH
- Body(raw):

```json
    {
      password?: string,
	  displayName?: string,
	  isActive?: boolean,
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {}
	}
```

### Get accounts

- Path: `/api/v1/user`
- Method: GET

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: [{
			id: string,
			username: string,
			displayName: string,
			isActive: string,
		}]
	}
```

### Create packing list

- Path: `/api/v1/pkl`
- Method: POST
- Body(raw):

```json
    {
      updating
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {
			updating
		}
	}
```

### Update packing list

- Path: `/api/v1/pkl/:id`
- Method: PATCH
- Body(raw):

```json
    {
      updating
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {
			updating
		}
	}
```

### Delete packinglist

- Path: `/api/v1/pkl/:id`
- Method: DELETE
- Body(raw):

```json
    {
      updating
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {
			updating
		}
	}
```

### Get packing list

- Path: `/api/v1/pkl`
- Method: GET
- Params: `exporting - bolean`, `weighing - boolean`

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: [{
			updating
		}]
	}
```

### Get packing list with id

- Path: `/api/v1/pkl/:id`
- Method: GET
- Params: `exporting - bolean`, `weighing - boolean`

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {
			updating
		}
	}
```

### Create Item

- Path: `/api/v1/item`
- Method: POST
- Body(raw):

```json
    {
      updating
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {
			updating
		}
	}
```

app.get('/api/v1/item', defaultHandler);

### Get all items

- Path: `/api/v1/item`
- Method: GET
- Params: `pklid`

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: {
			updating
		}
	}
```

### Update item: Export item process (not required session)

- Path: `/api/v1/mobile/export/:id`
- Method: PATCH
- Body(raw):

```json
    {
		sek_id: string,
		exported: boolean,
    }
```

- Response:

```json
	{
		error_code: number // 0 = success,
		message: string,
		data: { }
	}
```

### Update item: Weigh item process (not required session)

- Path: `/api/v1/mobile/weigh/:id`
- Method: PATCH
- Body(raw):

```json
    {
      	sek_id: string,
      	weigh: number,
    }
```

- Response:

````json
	{
		error_code: number // 0 = success,
		message: string,
		data: {}
	}
```
````
