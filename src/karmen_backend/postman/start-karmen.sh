{
	"info": {
		"_postman_id": "48d2f579-0f21-4c4e-ae94-acd67fc66a41",
		"name": "Generated Karmen API tests",
		"description": "API of https://github.com/fragaria/karmen",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "organizations",
			"item": [
				{
					"name": "{org uuid}",
					"item": [
						{
							"name": "printers",
							"item": [
								{
									"name": "{printer uuid}",
									"item": [
										{
											"name": "Return printer data",
											"request": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid?fields=<string>",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid"
													],
													"query": [
														{
															"key": "fields",
															"value": "<string>"
														}
													],
													"variable": [
														{
															"id": "4e7b68a0-db3e-4aed-a2ad-0ce50668a13f",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "3c325e93-4ac6-4ff3-8a3a-3507e67e498c",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "OK, printer object is returned",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid?fields=<string>",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"query": [
																{
																	"key": "fields",
																	"value": "<string>"
																}
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"client\": {\n  \"access_level\": \"unlocked\",\n  \"api_key\": \"ABCDEFXXXX123456\",\n  \"connected\": true,\n  \"name\": \"octoprint\",\n  \"pill_info\": {\n   \"karmen_version\": \"0.2.0\",\n   \"update_available\": \"0.2.2\",\n   \"update_status\": null,\n   \"version_number\": \"0.2.0\"\n  },\n  \"plugins\": [\n   \"karmen_awesome_led\"\n  ],\n  \"version\": {\n   \"api\": 0.1,\n   \"server\": \"0.0.1\",\n   \"text\": \"octoprint fake\"\n  }\n },\n \"hostname\": \"karmen_printer.local\",\n \"ip\": \"192.168.1.42\",\n \"job\": {\n  \"completion\": 42.42,\n  \"name\": \"holder_print.gcode\",\n  \"printTime\": 3066,\n  \"printTimeLeft\": 6060\n },\n \"lights\": \"on\",\n \"name\": \"fake priter 1\",\n \"path\": \"\",\n \"port\": 80,\n \"printer_props\": {\n  \"bed_type\": \"Powder coated PEI\",\n  \"filament_color\": \"black\",\n  \"filament_type\": \"PETG\",\n  \"tool0_diameter\": 0.25\n },\n \"protocol\": \"https\",\n \"status\": {\n  \"state\": \"Printing\",\n  \"temperature\": {\n   \"bed\": {\n    \"actual\": 35.7,\n    \"target\": 60\n   },\n   \"tool0\": {\n    \"actual\": 35.7,\n    \"target\": 270\n   }\n  }\n },\n \"token\": null,\n \"uuid\": \"20e91c14-c3e4-4fe9-a066-e69d53324a20\",\n \"webcam\": {\n  \"flipHorizontal\": false,\n  \"flipVertical\": false,\n  \"rotate90\": false,\n  \"url\": \"/organizations/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot\"\n }\n}"
												},
												{
													"name": "Printer not found. It either doesn't exists, or belongs to another organization",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid?fields=<string>",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"query": [
																{
																	"key": "fields",
																	"value": "<string>"
																}
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Not Found",
													"code": 404,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Not found\"\n}"
												},
												{
													"name": "Supplied UUID param was not valid UUID",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid?fields=<string>",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"query": [
																{
																	"key": "fields",
																	"value": "<string>"
																}
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Invalid uuid\"\n}"
												}
											]
										},
										{
											"name": "Change printer properties, modify it's name or change API key",
											"request": {
												"method": "PATCH",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid"
													],
													"variable": [
														{
															"id": "600df1a9-8839-4474-9c71-28f7542e3da0",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "f15f08c0-0014-4273-90e0-b8ab3f6e1e16",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Printer not found. It either doesn't exists, or is not in this organization",
													"originalRequest": {
														"method": "PATCH",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Not Found",
													"code": 404,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Not found\"\n}"
												},
												{
													"name": "Could not update printer",
													"originalRequest": {
														"method": "PATCH",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Missing payload\"\n}"
												},
												{
													"name": "OK, printer object is returned",
													"originalRequest": {
														"method": "PATCH",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"client\": {\n  \"access_level\": \"unlocked\",\n  \"api_key\": \"ABCDEFXXXX123456\",\n  \"connected\": true,\n  \"name\": \"octoprint\",\n  \"pill_info\": {\n   \"karmen_version\": \"0.2.0\",\n   \"update_available\": \"0.2.2\",\n   \"update_status\": null,\n   \"version_number\": \"0.2.0\"\n  },\n  \"plugins\": [\n   \"karmen_awesome_led\"\n  ],\n  \"version\": {\n   \"api\": 0.1,\n   \"server\": \"0.0.1\",\n   \"text\": \"octoprint fake\"\n  }\n },\n \"hostname\": \"karmen_printer.local\",\n \"ip\": \"192.168.1.42\",\n \"job\": {\n  \"completion\": 42.42,\n  \"name\": \"holder_print.gcode\",\n  \"printTime\": 3066,\n  \"printTimeLeft\": 6060\n },\n \"lights\": \"on\",\n \"name\": \"fake priter 1\",\n \"path\": \"\",\n \"port\": 80,\n \"printer_props\": {\n  \"bed_type\": \"Powder coated PEI\",\n  \"filament_color\": \"black\",\n  \"filament_type\": \"PETG\",\n  \"tool0_diameter\": 0.25\n },\n \"protocol\": \"https\",\n \"status\": {\n  \"state\": \"Printing\",\n  \"temperature\": {\n   \"bed\": {\n    \"actual\": 35.7,\n    \"target\": 60\n   },\n   \"tool0\": {\n    \"actual\": 35.7,\n    \"target\": 270\n   }\n  }\n },\n \"token\": null,\n \"uuid\": \"20e91c14-c3e4-4fe9-a066-e69d53324a20\",\n \"webcam\": {\n  \"flipHorizontal\": false,\n  \"flipVertical\": false,\n  \"rotate90\": false,\n  \"url\": \"/organizations/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot\"\n }\n}"
												}
											]
										},
										{
											"name": "Delete printer",
											"request": {
												"method": "DELETE",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid"
													],
													"variable": [
														{
															"id": "ff988610-5837-41c7-bbaa-846b67e5b6d5",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "e0fa342a-8ead-45a3-86c8-c9d2b009cf56",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Supplied UUID param was not valid UUID",
													"originalRequest": {
														"method": "DELETE",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Invalid uuid\"\n}"
												},
												{
													"name": "OK, printer deleted",
													"originalRequest": {
														"method": "DELETE",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												},
												{
													"name": "Printer not found. It either doesn't exists, or belongs to another organization",
													"originalRequest": {
														"method": "DELETE",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Not Found",
													"code": 404,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Not found\"\n}"
												}
											]
										},
										{
											"name": "Change connections state",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"state\": \"<string>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/connection",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"connection"
													],
													"variable": [
														{
															"id": "f3c102d9-c130-4b11-be33-f9d647b4eba5",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "e14fd31a-55b3-4b75-9acd-d334774b0512",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Invalid state was sent",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"state\": \"online\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/connection",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"connection"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"<state> is an uknown state\"\n}"
												},
												{
													"name": "Cannot change printer's state",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"state\": \"online\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/connection",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"connection"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Cannon change printer's connection state to <state>\"\n}"
												},
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"state\": \"online\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/connection",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"connection"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										},
										{
											"name": "Change  state of current job",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"action\": \"<string>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/current-job",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"current-job"
													],
													"variable": [
														{
															"id": "f9ca20e2-3a91-4b36-ae66-0846c08a2a0c",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "6b117144-d151-461a-872e-6c4353a85f5f",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"action\": \"cancel\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/current-job",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"current-job"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												},
												{
													"name": "Invalid state was sent",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"action\": \"cancel\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/current-job",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"current-job"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Missing action\"\n}"
												}
											]
										},
										{
											"name": "Get snapshot from the webcam",
											"request": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/webcam-snapshot",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"webcam-snapshot"
													],
													"variable": [
														{
															"id": "4edfe007-d21d-4f7f-90a6-d0fde3c2cdfc",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "5203d4f1-c5c8-475c-9336-0010da056276",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "OK, image is returned",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/webcam-snapshot",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"webcam-snapshot"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "image/jpeg"
														}
													],
													"cookie": [],
													"body": "<binary>"
												},
												{
													"name": "Karmen is establishing connection with the printer. Please try again later",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/webcam-snapshot",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"webcam-snapshot"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Accepted",
													"code": 202,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												},
												{
													"name": "Printer was not found or it doesn't have a webcam, or the image was not found at the expected url",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/webcam-snapshot",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"webcam-snapshot"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Not Found",
													"code": 404,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Not found\"\n}"
												}
											]
										},
										{
											"name": "Toggle state of printer light",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"status\": \"<string>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/lights",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"lights"
													],
													"variable": [
														{
															"id": "42a94d98-5452-45c9-a26c-7e9b70274091",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "48f94028-eba3-4a38-a99f-e6041d0b4b4f",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"status\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/lights",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"lights"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"status\": \"<string>\"\n}"
												},
												{
													"name": "Light is no available with this printer",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"status\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/lights",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"lights"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"status\": \"<string>\"\n}"
												}
											]
										},
										{
											"name": "Move printer head",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"command\": \"<string>\",\n    \"x\": \"<integer>\",\n    \"y\": \"<integer>\",\n    \"z\": \"<integer>\",\n    \"absolute\": \"<boolean>\",\n    \"axes\": \"<array>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/printhead",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"printhead"
													],
													"variable": [
														{
															"id": "c8657f17-3a26-493f-a58e-67aaf310c641",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "9e920682-4cb4-465c-be87-15873eb7d8f0",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Printer refused to move the head",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"command\": \"jog\",\n    \"x\": 10,\n    \"absolute\": false\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/printhead",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"printhead"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Cannot move the printhead\"\n}"
												},
												{
													"name": "Unable to process",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"command\": \"jog\",\n    \"x\": 10,\n    \"absolute\": false\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/printhead",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"printhead"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Distance on <axis> must be a number\"\n}"
												},
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"command\": \"jog\",\n    \"x\": 10,\n    \"absolute\": false\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/printhead",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"printhead"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										},
										{
											"name": "Toggle state of the printer fan",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"target\": \"<string>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/fan",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"fan"
													],
													"variable": [
														{
															"id": "7495f1b3-b616-456c-8948-b820836457d3",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "b29a7737-2e09-4753-85df-431b911287d9",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Target is not on or off",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/fan",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"fan"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Invalid target\"\n}"
												},
												{
													"name": "Printer has refused to toggle the fan",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/fan",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"fan"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Cannot control fan\"\n}"
												},
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/fan",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"fan"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										},
										{
											"name": "Disable motors",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"target\": \"<string>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/motors",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"motors"
													],
													"variable": [
														{
															"id": "66d6f527-6770-4fcb-b2fa-2081bab2889d",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "1e0aef62-70cf-4744-a41b-cbe5f554d446",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Target is not off",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"off\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/motors",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"motors"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Invalid target\"\n}"
												},
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"off\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/motors",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"motors"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												},
												{
													"name": "Printer refused to disable motors",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"off\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/motors",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"motors"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Cannot control motors\"\n}"
												}
											]
										},
										{
											"name": "Extrude or retract filament",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"target\": \"<string>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/extrusion",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"extrusion"
													],
													"variable": [
														{
															"id": "2757484a-07e7-4a8a-ad59-19b5dea7a4dd",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "eb7f67a6-cfce-44ca-9821-2f31b9228a53",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Printer refused to extract or retrude filament",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/extrusion",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"extrusion"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Cannot control extruder motor\"\n}"
												},
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/extrusion",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"extrusion"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												},
												{
													"name": "Target is not on or off",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": \"on\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/extrusion",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"extrusion"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Invalid target\"\n}"
												}
											]
										},
										{
											"name": "Set desired temperatures for part",
											"request": {
												"method": "POST",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"target\": \"<number>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/temperatures/:part_name",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"temperatures",
														":part_name"
													],
													"variable": [
														{
															"id": "2dcf10a6-8bac-47ca-a80f-53fc687a68ee",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "41659645-8588-4a11-9727-9544ddd7d1b0",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "c9b8f624-1a65-4bb2-a968-d959bb953a7b",
															"key": "part_name",
															"value": "<string>",
															"type": "string",
															"description": "(Required) Part to set semperature for"
														}
													]
												}
											},
											"response": [
												{
													"name": "Printer has refused to adjust the temperature",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": 60\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/temperatures/:part_name",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"temperatures",
																":part_name"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																},
																{
																	"key": "part_name"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Cannot set temperature\"\n}"
												},
												{
													"name": "Unable to process",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": 60\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/temperatures/:part_name",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"temperatures",
																":part_name"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																},
																{
																	"key": "part_name"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"<part_name> is not a valid part choice\"\n}"
												},
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"target\": 60\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/temperatures/:part_name",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"temperatures",
																":part_name"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																},
																{
																	"key": "part_name"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										},
										{
											"name": "Start update",
											"request": {
												"method": "POST",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/update",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers",
														":printer_uuid",
														"update"
													],
													"variable": [
														{
															"id": "3f856bc6-9258-4cd3-9e81-c8e6a1a7518c",
															"key": "printer_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "4d5da131-d835-49b8-ae8d-1ff77937a129",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Unable to process",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/update",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"update"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"The automatic update is supported on original Pill devices only\"\n}"
												},
												{
													"name": "Pill was unable to start the update process,",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/update",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"update"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "Internal Server Error",
													"code": 500,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"message\": \"Unable to start update\"\n}"
												},
												{
													"name": "OK",
													"originalRequest": {
														"method": "POST",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/printers/:printer_uuid/update",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"printers",
																":printer_uuid",
																"update"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "printer_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										}
									],
									"protocolProfileBehavior": {},
									"_postman_isSubFolder": true
								},
								{
									"name": "Get list of printers in an organization",
									"request": {
										"method": "GET",
										"header": [],
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/printers?fields=<string>",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"printers"
											],
											"query": [
												{
													"key": "fields",
													"value": "<string>"
												}
											],
											"variable": [
												{
													"id": "0ce4dc92-29e2-4b44-a174-5ee3989dffdc",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										}
									},
									"response": [
										{
											"name": "User is not a member of this organization, or doesn't exists at all",
											"originalRequest": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers?fields=<string>",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers"
													],
													"query": [
														{
															"key": "fields",
															"value": "<string>"
														}
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Forbidden",
											"code": 403,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"Cannot access this organization\"\n}"
										},
										{
											"name": "OK, list of printer objects is returned",
											"originalRequest": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers?fields=<string>",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers"
													],
													"query": [
														{
															"key": "fields",
															"value": "<string>"
														}
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"items\": [\n  {\n   \"client\": {\n    \"access_level\": \"unlocked\",\n    \"api_key\": \"ABCDEFXXXX123456\",\n    \"connected\": true,\n    \"name\": \"octoprint\",\n    \"pill_info\": {\n     \"karmen_version\": \"0.2.0\",\n     \"update_available\": \"0.2.2\",\n     \"update_status\": null,\n     \"version_number\": \"0.2.0\"\n    },\n    \"plugins\": [\n     \"karmen_awesome_led\"\n    ],\n    \"version\": {\n     \"api\": 0.1,\n     \"server\": \"0.0.1\",\n     \"text\": \"octoprint fake\"\n    }\n   },\n   \"hostname\": \"karmen_printer.local\",\n   \"ip\": \"192.168.1.42\",\n   \"job\": {\n    \"completion\": 42.42,\n    \"name\": \"holder_print.gcode\",\n    \"printTime\": 3066,\n    \"printTimeLeft\": 6060\n   },\n   \"lights\": \"on\",\n   \"name\": \"fake priter 1\",\n   \"path\": \"\",\n   \"port\": 80,\n   \"printer_props\": {\n    \"bed_type\": \"Powder coated PEI\",\n    \"filament_color\": \"black\",\n    \"filament_type\": \"PETG\",\n    \"tool0_diameter\": 0.25\n   },\n   \"protocol\": \"https\",\n   \"status\": {\n    \"state\": \"Printing\",\n    \"temperature\": {\n     \"bed\": {\n      \"actual\": 35.7,\n      \"target\": 60\n     },\n     \"tool0\": {\n      \"actual\": 35.7,\n      \"target\": 270\n     }\n    }\n   },\n   \"token\": null,\n   \"uuid\": \"20e91c14-c3e4-4fe9-a066-e69d53324a20\",\n   \"webcam\": {\n    \"flipHorizontal\": false,\n    \"flipVertical\": false,\n    \"rotate90\": false,\n    \"url\": \"/organizations/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot\"\n   }\n  },\n  {\n   \"client\": {\n    \"access_level\": \"unlocked\",\n    \"api_key\": \"ABCDEFXXXX123456\",\n    \"connected\": true,\n    \"name\": \"octoprint\",\n    \"pill_info\": {\n     \"karmen_version\": \"0.2.0\",\n     \"update_available\": \"0.2.2\",\n     \"update_status\": null,\n     \"version_number\": \"0.2.0\"\n    },\n    \"plugins\": [\n     \"karmen_awesome_led\"\n    ],\n    \"version\": {\n     \"api\": 0.1,\n     \"server\": \"0.0.1\",\n     \"text\": \"octoprint fake\"\n    }\n   },\n   \"hostname\": \"karmen_printer.local\",\n   \"ip\": \"192.168.1.42\",\n   \"job\": {\n    \"completion\": 42.42,\n    \"name\": \"holder_print.gcode\",\n    \"printTime\": 3066,\n    \"printTimeLeft\": 6060\n   },\n   \"lights\": \"on\",\n   \"name\": \"fake priter 1\",\n   \"path\": \"\",\n   \"port\": 80,\n   \"printer_props\": {\n    \"bed_type\": \"Powder coated PEI\",\n    \"filament_color\": \"black\",\n    \"filament_type\": \"PETG\",\n    \"tool0_diameter\": 0.25\n   },\n   \"protocol\": \"https\",\n   \"status\": {\n    \"state\": \"Printing\",\n    \"temperature\": {\n     \"bed\": {\n      \"actual\": 35.7,\n      \"target\": 60\n     },\n     \"tool0\": {\n      \"actual\": 35.7,\n      \"target\": 270\n     }\n    }\n   },\n   \"token\": null,\n   \"uuid\": \"20e91c14-c3e4-4fe9-a066-e69d53324a20\",\n   \"webcam\": {\n    \"flipHorizontal\": false,\n    \"flipVertical\": false,\n    \"rotate90\": false,\n    \"url\": \"/organizations/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot\"\n   }\n  }\n ]\n}"
										},
										{
											"name": "Supplied UUID param was not valid UUID",
											"originalRequest": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers?fields=<string>",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers"
													],
													"query": [
														{
															"key": "fields",
															"value": "<string>"
														}
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Bad Request",
											"code": 400,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"Invalid uuid\"\n}"
										}
									]
								},
								{
									"name": "Create printer",
									"request": {
										"method": "POST",
										"header": [
											{
												"key": "Content-Type",
												"value": "application/json"
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"name\": \"<string>\",\n    \"protocol\": \"<string>\",\n    \"ip\": \"<ipv4>\",\n    \"port\": \"<integer>\",\n    \"hostname\": \"<hostname>\",\n    \"path\": \"<string>\",\n    \"api_key\": \"<string>\"\n}",
											"options": {
												"raw": {}
											}
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/printers",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"printers"
											],
											"variable": [
												{
													"id": "ebb2997a-4ddd-4635-b78b-91873e25b747",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										},
										"description": "Post to this endpoint to add a printer. In CLOUD_MODE, you can add printer by token. In non-CLOUD mode, printer addition requires specifying the network address (IP or hostname). Now, we only specify printer_by_network_props, and printer_by_token is commented. This is because of a bug in connexion https://github.com/zalando/connexion/issues/691 because of which oneOf doesn't work in request bodies"
									},
									"response": [
										{
											"name": "OK, printer_response is returned without additional fields",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"name\": \"Printer name\",\n    \"token\": \"ABC123\",\n    \"protocol\": \"https\",\n    \"api_key\": \"\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"client\": {\n  \"access_level\": \"unlocked\",\n  \"api_key\": \"ABCDEFXXXX123456\",\n  \"connected\": true,\n  \"name\": \"octoprint\",\n  \"pill_info\": {\n   \"karmen_version\": \"0.2.0\",\n   \"update_available\": \"0.2.2\",\n   \"update_status\": null,\n   \"version_number\": \"0.2.0\"\n  },\n  \"plugins\": [\n   \"karmen_awesome_led\"\n  ],\n  \"version\": {\n   \"api\": 0.1,\n   \"server\": \"0.0.1\",\n   \"text\": \"octoprint fake\"\n  }\n },\n \"hostname\": \"karmen_printer.local\",\n \"ip\": \"192.168.1.42\",\n \"job\": {\n  \"completion\": 42.42,\n  \"name\": \"holder_print.gcode\",\n  \"printTime\": 3066,\n  \"printTimeLeft\": 6060\n },\n \"lights\": \"on\",\n \"name\": \"fake priter 1\",\n \"path\": \"\",\n \"port\": 80,\n \"printer_props\": {\n  \"bed_type\": \"Powder coated PEI\",\n  \"filament_color\": \"black\",\n  \"filament_type\": \"PETG\",\n  \"tool0_diameter\": 0.25\n },\n \"protocol\": \"https\",\n \"status\": {\n  \"state\": \"Printing\",\n  \"temperature\": {\n   \"bed\": {\n    \"actual\": 35.7,\n    \"target\": 60\n   },\n   \"tool0\": {\n    \"actual\": 35.7,\n    \"target\": 270\n   }\n  }\n },\n \"token\": null,\n \"uuid\": \"20e91c14-c3e4-4fe9-a066-e69d53324a20\",\n \"webcam\": {\n  \"flipHorizontal\": false,\n  \"flipVertical\": false,\n  \"rotate90\": false,\n  \"url\": \"/organizations/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot\"\n }\n}"
										},
										{
											"name": "Error while adding printer",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"name\": \"Printer name\",\n    \"token\": \"ABC123\",\n    \"protocol\": \"https\",\n    \"api_key\": \"\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Internal Server Error",
											"code": 500,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"Cannot resolve {hostname} with mDNS\"\n}"
										},
										{
											"name": "Printer with this token or ip, port, path already exists in this organization",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"name\": \"Printer name\",\n    \"token\": \"ABC123\",\n    \"protocol\": \"https\",\n    \"api_key\": \"\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Conflict",
											"code": 409,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"Printer already exists\"\n}"
										},
										{
											"name": "Could not create printer",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"name\": \"Printer name\",\n    \"token\": \"ABC123\",\n    \"protocol\": \"https\",\n    \"api_key\": \"\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printers",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printers"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Bad Request",
											"code": 400,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"Missing token\"\n}"
										}
									]
								}
							],
							"protocolProfileBehavior": {},
							"_postman_isSubFolder": true
						},
						{
							"name": "users",
							"item": [
								{
									"name": "{user uuid}",
									"item": [
										{
											"name": "Change user's role in an organization",
											"request": {
												"method": "PATCH",
												"header": [
													{
														"key": "Content-Type",
														"value": "application/json"
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"role\": \"<string>\"\n}",
													"options": {
														"raw": {}
													}
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/users/:user_uuid",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"users",
														":user_uuid"
													],
													"variable": [
														{
															"id": "6603086b-4ea9-44dd-9cfd-d7c5bdf62b7e",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "8b8ed349-a113-44fa-bda5-6eafa8b1e4a4",
															"key": "user_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Role changed",
													"originalRequest": {
														"method": "PATCH",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"role\": \"<string>\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/users/:user_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"users",
																":user_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "user_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"activated\": false,\n \"role\": \"<string>\",\n \"email\": \"<email>\",\n \"username\": \"<string>\",\n \"uuid\": \"<uuid>\"\n}"
												},
												{
													"name": "Bad role",
													"originalRequest": {
														"method": "PATCH",
														"header": [],
														"body": {
															"mode": "raw",
															"raw": "{\n    \"role\": \"<string>\"\n}"
														},
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/users/:user_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"users",
																":user_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "user_uuid"
																}
															]
														}
													},
													"status": "Bad Request",
													"code": 400,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										},
										{
											"name": "Remove user from an organization",
											"request": {
												"method": "DELETE",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/users/:user_uuid",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"users",
														":user_uuid"
													],
													"variable": [
														{
															"id": "28210d69-9a66-4315-a6ac-07f4ee9e0ac4",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "f562b19e-96b9-4543-aa58-bccb6452579e",
															"key": "user_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "User removed",
													"originalRequest": {
														"method": "DELETE",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/users/:user_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"users",
																":user_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "user_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												},
												{
													"name": "Cannot remove yourself",
													"originalRequest": {
														"method": "DELETE",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/users/:user_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"users",
																":user_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "user_uuid"
																}
															]
														}
													},
													"status": "Conflict",
													"code": 409,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										}
									],
									"protocolProfileBehavior": {},
									"_postman_isSubFolder": true
								},
								{
									"name": "Add user to organization by his email",
									"request": {
										"method": "POST",
										"header": [
											{
												"key": "Content-Type",
												"value": "application/json"
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"email\": \"<email>\",\n    \"role\": \"<string>\"\n}",
											"options": {
												"raw": {}
											}
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/users",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"users"
											],
											"variable": [
												{
													"id": "3dd9259c-2e06-4dc1-8cdc-f45d94833514",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										},
										"description": "If user exists, he is added to the org. Otherwise, new account is created and invitation is sent to him"
									},
									"response": [
										{
											"name": "Unable to create or add user",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"email\": \"<email>\",\n    \"role\": \"<string>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/users",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"users"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Bad Request",
											"code": 400,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"Missing email\"\n}"
										},
										{
											"name": "Untitled Example",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"email\": \"<email>\",\n    \"role\": \"<string>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/users",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"users"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"activated\": false,\n \"role\": \"<string>\",\n \"email\": \"<email>\",\n \"username\": \"<string>\",\n \"uuid\": \"<uuid>\"\n}"
										}
									]
								},
								{
									"name": "Get list of users in an organization",
									"request": {
										"method": "GET",
										"header": [],
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/users",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"users"
											],
											"variable": [
												{
													"id": "452a8376-f9ec-4210-ae66-d0207ccab4a3",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										}
									},
									"response": [
										{
											"name": "List of users",
											"originalRequest": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/users",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"users"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "\"schema type not provided\""
										}
									]
								}
							],
							"protocolProfileBehavior": {},
							"_postman_isSubFolder": true
						},
						{
							"name": "gcodes",
							"item": [
								{
									"name": "{gcode uuid}",
									"item": [
										{
											"name": "Get gcode details",
											"request": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes/:gcode_uuid",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"gcodes",
														":gcode_uuid"
													],
													"variable": [
														{
															"id": "b7068231-0be0-41d8-afbc-a4b1dc3411dd",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "ad6a2739-8b53-446d-b6d5-979f8b8bbc26",
															"key": "gcode_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Gcode details",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes/:gcode_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"gcodes",
																":gcode_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "gcode_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "json",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/json"
														}
													],
													"cookie": [],
													"body": "{\n \"absolute_path\": \"/tmp/karmen-files/b3060e41-e319-4a9b-8ac4-e0936c75f275/USB_SD_holder27x.gcode\",\n \"analysis\": {\n  \"filament\": {\n   \"length_mm\": 183441.1,\n   \"type\": \"<string>\",\n   \"volume_cm3\": \"<number>\"\n  },\n  \"slicer\": \"PrusaSlicer 2.2.0-alpha2+linux-x64\",\n  \"temperatures\": {\n   \"bed\": \"<number>\",\n   \"bed_first\": \"<number>\",\n   \"tool0\": \"<number>\",\n   \"tool0_first\": \"<number>\"\n  }\n },\n \"data\": \"<path>\",\n \"display\": \"<string>\",\n \"filename\": \"<string>\",\n \"path\": \"<path>\",\n \"size\": \"<integer>\",\n \"uploaded\": {},\n \"user_uuid\": \"<uuid>\",\n \"username\": \"<string>\",\n \"uuid\": \"<uuid>\"\n}"
												}
											]
										},
										{
											"name": "Delete gcode",
											"request": {
												"method": "DELETE",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes/:gcode_uuid",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"gcodes",
														":gcode_uuid"
													],
													"variable": [
														{
															"id": "c01ebbd0-862e-4109-aa55-df0ac2635ea0",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "db8d0500-a563-4dfe-9555-42de34e35685",
															"key": "gcode_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Deleted",
													"originalRequest": {
														"method": "DELETE",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes/:gcode_uuid",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"gcodes",
																":gcode_uuid"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "gcode_uuid"
																}
															]
														}
													},
													"status": "No Content",
													"code": 204,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "text/plain"
														}
													],
													"cookie": [],
													"body": ""
												}
											]
										},
										{
											"name": "Download gcode file",
											"request": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes/:gcode_uuid/data",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"gcodes",
														":gcode_uuid",
														"data"
													],
													"variable": [
														{
															"id": "3ee9278d-2cc0-4dd9-8c2b-d6a90f01c176",
															"key": "org_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														},
														{
															"id": "00c5157f-ee7c-4808-b0e7-82cef1be334b",
															"key": "gcode_uuid",
															"value": "<uuid>",
															"type": "string",
															"description": "(Required) "
														}
													]
												}
											},
											"response": [
												{
													"name": "Gcode file",
													"originalRequest": {
														"method": "GET",
														"header": [],
														"url": {
															"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes/:gcode_uuid/data",
															"host": [
																"{{baseUrl}}"
															],
															"path": [
																"organizations",
																":org_uuid",
																"gcodes",
																":gcode_uuid",
																"data"
															],
															"variable": [
																{
																	"key": "org_uuid"
																},
																{
																	"key": "gcode_uuid"
																}
															]
														}
													},
													"status": "OK",
													"code": 200,
													"_postman_previewlanguage": "text",
													"header": [
														{
															"key": "Content-Type",
															"value": "application/octet-stream"
														}
													],
													"cookie": [],
													"body": "<binary>"
												}
											]
										}
									],
									"protocolProfileBehavior": {},
									"_postman_isSubFolder": true
								},
								{
									"name": "List new gcodes",
									"request": {
										"method": "GET",
										"header": [],
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes?limit=200&order_by=<string>&fields=<string>&search=<string>&start_with=<string>",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"gcodes"
											],
											"query": [
												{
													"key": "limit",
													"value": "200"
												},
												{
													"key": "order_by",
													"value": "<string>"
												},
												{
													"key": "fields",
													"value": "<string>"
												},
												{
													"key": "search",
													"value": "<string>"
												},
												{
													"key": "start_with",
													"value": "<string>"
												}
											],
											"variable": [
												{
													"id": "212f2f35-152f-4c47-931a-4a78c06eea8a",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										}
									},
									"response": [
										{
											"name": "List of gcodes",
											"originalRequest": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes?limit=200&order_by=<string>&fields=<string>&search=<string>&start_with=<string>",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"gcodes"
													],
													"query": [
														{
															"key": "limit",
															"value": "200"
														},
														{
															"key": "order_by",
															"value": "<string>"
														},
														{
															"key": "fields",
															"value": "<string>"
														},
														{
															"key": "search",
															"value": "<string>"
														},
														{
															"key": "start_with",
															"value": "<string>"
														}
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "\"schema type not provided\""
										}
									]
								},
								{
									"name": "Upload gcode",
									"request": {
										"method": "POST",
										"header": [
											{
												"key": "Content-Type",
												"value": "multipart/form-data"
											}
										],
										"body": {
											"mode": "formdata",
											"formdata": [
												{
													"key": "path",
													"value": "<binary>"
												},
												{
													"key": "file",
													"value": "<binary>"
												}
											],
											"options": {
												"formdata": {}
											}
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"gcodes"
											],
											"variable": [
												{
													"id": "80e41a30-1ba8-4b68-ad77-9999b76551a5",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										}
									},
									"response": [
										{
											"name": "Created",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "formdata",
													"formdata": [
														{
															"key": "path",
															"value": "<binary>",
															"description": {
																"content": "",
																"type": "text/plain"
															}
														},
														{
															"key": "file",
															"value": "<binary>",
															"description": {
																"content": "",
																"type": "text/plain"
															}
														}
													]
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/gcodes",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"gcodes"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Created",
											"code": 201,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"absolute_path\": \"/tmp/karmen-files/b3060e41-e319-4a9b-8ac4-e0936c75f275/USB_SD_holder27x.gcode\",\n \"analysis\": {\n  \"filament\": {\n   \"length_mm\": 183441.1,\n   \"type\": \"<string>\",\n   \"volume_cm3\": \"<number>\"\n  },\n  \"slicer\": \"PrusaSlicer 2.2.0-alpha2+linux-x64\",\n  \"temperatures\": {\n   \"bed\": \"<number>\",\n   \"bed_first\": \"<number>\",\n   \"tool0\": \"<number>\",\n   \"tool0_first\": \"<number>\"\n  }\n },\n \"data\": \"<path>\",\n \"display\": \"<string>\",\n \"filename\": \"<string>\",\n \"path\": \"<path>\",\n \"size\": \"<integer>\",\n \"uploaded\": {},\n \"user_uuid\": \"<uuid>\",\n \"username\": \"<string>\",\n \"uuid\": \"<uuid>\"\n}"
										}
									]
								}
							],
							"protocolProfileBehavior": {},
							"_postman_isSubFolder": true
						},
						{
							"name": "printjobs",
							"item": [
								{
									"name": "Start printing gcode on a printer",
									"request": {
										"method": "POST",
										"header": [
											{
												"key": "Content-Type",
												"value": "application/json"
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"gcode\": \"<uuid>\",\n    \"printer\": \"<uuid>\"\n}",
											"options": {
												"raw": {}
											}
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"printjobs"
											],
											"variable": [
												{
													"id": "35f4b7f7-3132-4c4c-a4ce-145c45778cce",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										}
									},
									"response": [
										{
											"name": "The job could not be scheduled due to invalid data (probably printer or gcode uuid).",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"gcode\": \"<uuid>\",\n    \"printer\": \"<uuid>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printjobs"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Unprocessable Entity (WebDAV) (RFC 4918)",
											"code": 422,
											"_postman_previewlanguage": "text",
											"header": [
												{
													"key": "Content-Type",
													"value": "text/plain"
												}
											],
											"cookie": [],
											"body": ""
										},
										{
											"name": "Printjob scheduled",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"gcode\": \"<uuid>\",\n    \"printer\": \"<uuid>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printjobs"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Created",
											"code": 201,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"user_uuid\": \"<uuid>\",\n \"uuid\": \"<uuid>\"\n}"
										},
										{
											"name": "Could ot schedule a printjob",
											"originalRequest": {
												"method": "POST",
												"header": [],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"gcode\": \"<uuid>\",\n    \"printer\": \"<uuid>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printjobs"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Conflict",
											"code": 409,
											"_postman_previewlanguage": "text",
											"header": [
												{
													"key": "Content-Type",
													"value": "text/plain"
												}
											],
											"cookie": [],
											"body": ""
										}
									]
								},
								{
									"name": "List printjobs",
									"request": {
										"method": "GET",
										"header": [],
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs?limit=200&start_with=<uuid>&order_by=<string>&fields=<string>&filter=<string>&printer_uuid=<uuid>",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"printjobs"
											],
											"query": [
												{
													"key": "limit",
													"value": "200"
												},
												{
													"key": "start_with",
													"value": "<uuid>"
												},
												{
													"key": "order_by",
													"value": "<string>"
												},
												{
													"key": "fields",
													"value": "<string>"
												},
												{
													"key": "filter",
													"value": "<string>"
												},
												{
													"key": "printer_uuid",
													"value": "<uuid>",
													"description": "Printer to list printjobs for"
												}
											],
											"variable": [
												{
													"id": "20066fff-3584-41b2-aad6-ac026b13283f",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										}
									},
									"response": [
										{
											"name": "List of printjobs",
											"originalRequest": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs?limit=200&start_with=<uuid>&order_by=<string>&fields=<string>&filter=<string>&printer_uuid=<uuid>",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printjobs"
													],
													"query": [
														{
															"key": "limit",
															"value": "200"
														},
														{
															"key": "start_with",
															"value": "<uuid>"
														},
														{
															"key": "order_by",
															"value": "<string>"
														},
														{
															"key": "fields",
															"value": "<string>"
														},
														{
															"key": "filter",
															"value": "<string>"
														},
														{
															"key": "printer_uuid",
															"value": "<uuid>"
														}
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"gcode_data\": {\n  \"available\": \"<boolean>\",\n  \"fileame\": \"<string>\",\n  \"size\": \"<integer>\",\n  \"uuid\": \"<uuid>\"\n },\n \"printer_data\": {\n  \"name\": \"My Printer\",\n  \"protocol\": \"http\",\n  \"ip\": \"192.168.5.42\",\n  \"port\": 80,\n  \"hostname\": \"karmen.local\",\n  \"path\": \"\",\n  \"api_key\": \"\"\n },\n \"printer_uuid\": \"<uuid>\",\n \"user_uuid\": \"<uuid>\",\n \"uuid\": \"<uuid>\",\n \"started\": \"2020-05-21T11:36:53.621361+00:00\",\n \"username\": \"<string>\"\n}"
										}
									]
								},
								{
									"name": "Get printjob detail",
									"request": {
										"method": "GET",
										"header": [],
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs/:printjob_uuid",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"printjobs",
												":printjob_uuid"
											],
											"variable": [
												{
													"id": "53adafcd-4393-4609-bb14-c49e4fd741e9",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												},
												{
													"id": "025a21ee-18ec-48ef-9bb8-39abdc05eb1a",
													"key": "printjob_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										}
									},
									"response": [
										{
											"name": "Printjob detail",
											"originalRequest": {
												"method": "GET",
												"header": [],
												"url": {
													"raw": "{{baseUrl}}/organizations/:org_uuid/printjobs/:printjob_uuid",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"organizations",
														":org_uuid",
														"printjobs",
														":printjob_uuid"
													],
													"variable": [
														{
															"key": "org_uuid"
														},
														{
															"key": "printjob_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"items\": \"<list>\"\n}"
										}
									]
								}
							],
							"protocolProfileBehavior": {},
							"_postman_isSubFolder": true
						},
						{
							"name": "Rename orgaization",
							"request": {
								"method": "PATCH",
								"header": [
									{
										"key": "Content-Type",
										"value": "application/json"
									}
								],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"name\": \"<string>\"\n}",
									"options": {
										"raw": {}
									}
								},
								"url": {
									"raw": "{{baseUrl}}/organizations/:org_uuid",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"organizations",
										":org_uuid"
									],
									"variable": [
										{
											"id": "ca3deabd-5543-417e-8735-d616cc2013af",
											"key": "org_uuid",
											"value": "<uuid>",
											"type": "string",
											"description": "(Required) "
										}
									]
								}
							},
							"response": [
								{
									"name": "Renamed",
									"originalRequest": {
										"method": "PATCH",
										"header": [],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"name\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid"
											],
											"variable": [
												{
													"key": "org_uuid"
												}
											]
										}
									},
									"status": "OK",
									"code": 200,
									"_postman_previewlanguage": "json",
									"header": [
										{
											"key": "Content-Type",
											"value": "application/json"
										}
									],
									"cookie": [],
									"body": "{\n \"name\": \"<string>\",\n \"uuid\": \"<uuid>\"\n}"
								}
							]
						},
						{
							"name": "Schedule a background task for an orgaization. Currently we have only on, scan_network, supported only in non-cloud mode. This one scans the network for any octoprint boxes.",
							"request": {
								"method": "POST",
								"header": [
									{
										"key": "Content-Type",
										"value": "application/json"
									}
								],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"task\": \"<string>\"\n}",
									"options": {
										"raw": {}
									}
								},
								"url": {
									"raw": "{{baseUrl}}/organizations/:org_uuid/tasks",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"organizations",
										":org_uuid",
										"tasks"
									],
									"variable": [
										{
											"id": "f7e23058-b648-4367-a604-c4d25b975cd2",
											"key": "org_uuid",
											"value": "<uuid>",
											"type": "string",
											"description": "(Required) "
										}
									]
								}
							},
							"response": [
								{
									"name": "Task created",
									"originalRequest": {
										"method": "POST",
										"header": [],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"task\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/tasks",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"tasks"
											],
											"variable": [
												{
													"key": "org_uuid"
												}
											]
										}
									},
									"status": "Accepted",
									"code": 202,
									"_postman_previewlanguage": "text",
									"header": [
										{
											"key": "Content-Type",
											"value": "text/plain"
										}
									],
									"cookie": [],
									"body": ""
								},
								{
									"name": "Invalid task",
									"originalRequest": {
										"method": "POST",
										"header": [],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"task\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/tasks",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"tasks"
											],
											"variable": [
												{
													"key": "org_uuid"
												}
											]
										}
									},
									"status": "Bad Request",
									"code": 400,
									"_postman_previewlanguage": "text",
									"header": [
										{
											"key": "Content-Type",
											"value": "text/plain"
										}
									],
									"cookie": [],
									"body": ""
								},
								{
									"name": "Not allowed in clud mode",
									"originalRequest": {
										"method": "POST",
										"header": [],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"task\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/organizations/:org_uuid/tasks",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"organizations",
												":org_uuid",
												"tasks"
											],
											"variable": [
												{
													"key": "org_uuid"
												}
											]
										}
									},
									"status": "Internal Server Error",
									"code": 500,
									"_postman_previewlanguage": "text",
									"header": [
										{
											"key": "Content-Type",
											"value": "text/plain"
										}
									],
									"cookie": [],
									"body": ""
								}
							]
						}
					],
					"protocolProfileBehavior": {},
					"_postman_isSubFolder": true
				},
				{
					"name": "Create new organization",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"name\": \"<string>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/organizations",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"organizations"
							]
						}
					},
					"response": [
						{
							"name": "Created",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"name\": \"<string>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/organizations",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"organizations"
									]
								}
							},
							"status": "Created",
							"code": 201,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"name\": \"<string>\",\n \"uuid\": \"<uuid>\"\n}"
						}
					]
				},
				{
					"name": "List organizations",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/organizations",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"organizations"
							]
						}
					},
					"response": [
						{
							"name": "List of organizations",
							"originalRequest": {
								"method": "GET",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/organizations",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"organizations"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"items\": \"<list>\"\n}"
						}
					]
				}
			],
			"protocolProfileBehavior": {}
		},
		{
			"name": "users/me",
			"item": [
				{
					"name": "tokens",
					"item": [
						{
							"name": "List current user's API tokens",
							"request": {
								"method": "GET",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/users/me/tokens",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"tokens"
									]
								}
							},
							"response": [
								{
									"name": "List of tokens",
									"originalRequest": {
										"method": "GET",
										"header": [],
										"url": {
											"raw": "{{baseUrl}}/users/me/tokens",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"users",
												"me",
												"tokens"
											]
										}
									},
									"status": "OK",
									"code": 200,
									"_postman_previewlanguage": "json",
									"header": [
										{
											"key": "Content-Type",
											"value": "application/json"
										}
									],
									"cookie": [],
									"body": "{\n \"created\": \"<dateTime>\",\n \"jti\": \"<uuid>\",\n \"name\": \"<string>\",\n \"organization\": {\n  \"name\": \"<string>\",\n  \"uuid\": \"<uuid>\"\n }\n}"
								}
							]
						},
						{
							"name": "Create new API token",
							"request": {
								"method": "POST",
								"header": [
									{
										"key": "Content-Type",
										"value": "application/json"
									}
								],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"name\": \"<string>\"\n}",
									"options": {
										"raw": {}
									}
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/tokens",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"tokens"
									]
								}
							},
							"response": [
								{
									"name": "OK",
									"originalRequest": {
										"method": "POST",
										"header": [],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"name\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/users/me/tokens",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"users",
												"me",
												"tokens"
											]
										}
									},
									"status": "OK",
									"code": 200,
									"_postman_previewlanguage": "json",
									"header": [
										{
											"key": "Content-Type",
											"value": "application/json"
										}
									],
									"cookie": [],
									"body": "{\n \"access_token\": \"<string>\",\n \"created\": \"<dateTime>\",\n \"jti\": \"<uuid>\",\n \"name\": \"<string>\",\n \"organization\": {\n  \"name\": \"<string>\",\n  \"uuid\": \"<uuid>\"\n }\n}"
								}
							]
						},
						{
							"name": "Revoke API token",
							"request": {
								"method": "DELETE",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/users/me/tokens/:jti",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"tokens",
										":jti"
									],
									"variable": [
										{
											"id": "7f440a4e-a152-42a0-8d75-cc12dbe48e0d",
											"key": "jti",
											"value": "<string>",
											"type": "string",
											"description": "(Required) "
										}
									]
								}
							},
							"response": [
								{
									"name": "Revoked",
									"originalRequest": {
										"method": "DELETE",
										"header": [],
										"url": {
											"raw": "{{baseUrl}}/users/me/tokens/:jti",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"users",
												"me",
												"tokens",
												":jti"
											],
											"variable": [
												{
													"key": "jti"
												}
											]
										}
									},
									"status": "No Content",
									"code": 204,
									"_postman_previewlanguage": "text",
									"header": [
										{
											"key": "Content-Type",
											"value": "text/plain"
										}
									],
									"cookie": [],
									"body": ""
								}
							]
						}
					],
					"protocolProfileBehavior": {},
					"_postman_isSubFolder": true
				},
				{
					"name": "Register new user",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"email\": \"<email>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me"
							]
						}
					},
					"response": [
						{
							"name": "User created, empty response",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me"
									]
								}
							},
							"status": "Accepted",
							"code": 202,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						},
						{
							"name": "Unable to create user",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me"
									]
								}
							},
							"status": "Bad Request",
							"code": 400,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"message\": \"Missing email\"\n}"
						}
					]
				},
				{
					"name": "Change username",
					"request": {
						"method": "PATCH",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"username\": \"<username>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me"
							]
						}
					},
					"response": [
						{
							"name": "Cannot change",
							"originalRequest": {
								"method": "PATCH",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"username\": \"<username>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me"
									]
								}
							},
							"status": "Bad Request",
							"code": 400,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						},
						{
							"name": "Unauthorized",
							"originalRequest": {
								"method": "PATCH",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"username\": \"<username>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me"
									]
								}
							},
							"status": "Unauthorized",
							"code": 401,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						},
						{
							"name": "Username changed",
							"originalRequest": {
								"method": "PATCH",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"username\": \"<username>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"email\": \"<email>\",\n \"expires_on\": \"<dateTime>\",\n \"force_pwd_change\": \"<boolean>\",\n \"fresh\": \"<boolean>\",\n \"identity\": \"<uuid>\",\n \"system_role\": \"<string>\",\n \"username\": \"<string>\",\n \"organizations\": \"<list>\"\n}"
						}
					]
				},
				{
					"name": "Activate newly created user",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"email\": \"<email>\",\n    \"activation_key\": \"<string>\",\n    \"password\": \"<password>\",\n    \"password_confirmation\": \"<password>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me/activate",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"activate"
							]
						}
					},
					"response": [
						{
							"name": "Activation failed",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"activation_key\": \"<string>\",\n    \"password\": \"<password>\",\n    \"password_confirmation\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/activate",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"activate"
									]
								}
							},
							"status": "Not Found",
							"code": 404,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						},
						{
							"name": "User activated",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"activation_key\": \"<string>\",\n    \"password\": \"<password>\",\n    \"password_confirmation\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/activate",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"activate"
									]
								}
							},
							"status": "No Content",
							"code": 204,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						}
					]
				},
				{
					"name": "Request password reset for user",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"email\": \"<email>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me/request-password-reset",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"request-password-reset"
							]
						}
					},
					"response": [
						{
							"name": "Request not valid",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/request-password-reset",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"request-password-reset"
									]
								}
							},
							"status": "Bad Request",
							"code": 400,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						},
						{
							"name": "Password reset requested, empty response",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/request-password-reset",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"request-password-reset"
									]
								}
							},
							"status": "Accepted",
							"code": 202,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						}
					]
				},
				{
					"name": "Process requested password reset",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"email\": \"<email>\",\n    \"pwd_reset_key\": \"<string>\",\n    \"password\": \"<password>\",\n    \"password_confirmation\": \"<password>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me/reset-password",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"reset-password"
							]
						}
					},
					"response": [
						{
							"name": "Password reset unsuccessfull",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"pwd_reset_key\": \"<string>\",\n    \"password\": \"<password>\",\n    \"password_confirmation\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/reset-password",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"reset-password"
									]
								}
							},
							"status": "Bad Request",
							"code": 400,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						},
						{
							"name": "Password changed",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"pwd_reset_key\": \"<string>\",\n    \"password\": \"<password>\",\n    \"password_confirmation\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/reset-password",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"reset-password"
									]
								}
							},
							"status": "No Content",
							"code": 204,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						}
					]
				},
				{
					"name": "Login using username and password and get refresh token",
					"event": [
						{
							"listen": "test",
							"script": {
								"id": "44be9f5f-5d34-46fb-8ffd-6db5bdc9bf66",
								"exec": [
									"pm.test(\"Status code is 200\", function () {",
									"    pm.response.to.have.status(200);",
									"});",
									"",
									"pm.test(\"has organizations\", function () {",
									"    pm.expect(pm.response.text()).to.include('\"organizations\":');",
									"});"
								],
								"type": "text/javascript"
							}
						}
					],
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"username\": \"{{user}}\",\n    \"password\": \"{{password}}\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me/authenticate",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"authenticate"
							]
						}
					},
					"response": [
						{
							"name": "Login successfull",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/authenticate",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"authenticate"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"email\": \"<email>\",\n \"expires_on\": \"<dateTime>\",\n \"force_pwd_change\": \"<boolean>\",\n \"fresh\": \"<boolean>\",\n \"identity\": \"<uuid>\",\n \"system_role\": \"<string>\",\n \"username\": \"<string>\",\n \"organizations\": \"<list>\"\n}"
						},
						{
							"name": "Wrong login",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/authenticate",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"authenticate"
									]
								}
							},
							"status": "Unauthorized",
							"code": 401,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						}
					]
				},
				{
					"name": "Get new access token and no refresh token",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<password>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me/authenticate-fresh",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"authenticate-fresh"
							]
						}
					},
					"response": [
						{
							"name": "Unauthorized",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/authenticate-fresh",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"authenticate-fresh"
									]
								}
							},
							"status": "Unauthorized",
							"code": 401,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						},
						{
							"name": "Ok",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/authenticate-fresh",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"authenticate-fresh"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"email\": \"<email>\",\n \"expires_on\": \"<dateTime>\",\n \"force_pwd_change\": \"<boolean>\",\n \"fresh\": \"<boolean>\",\n \"identity\": \"<uuid>\",\n \"system_role\": \"<string>\",\n \"username\": \"<string>\",\n \"organizations\": \"<list>\"\n}"
						}
					]
				},
				{
					"name": "Get new refresh token",
					"request": {
						"method": "POST",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/users/me/authenticate-refresh",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"authenticate-refresh"
							]
						}
					},
					"response": [
						{
							"name": "Untitled Example",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/users/me/authenticate-refresh",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"authenticate-refresh"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"email\": \"<email>\",\n \"expires_on\": \"<dateTime>\",\n \"force_pwd_change\": \"<boolean>\",\n \"fresh\": \"<boolean>\",\n \"identity\": \"<uuid>\",\n \"system_role\": \"<string>\",\n \"username\": \"<string>\",\n \"organizations\": \"<list>\"\n}"
						}
					]
				},
				{
					"name": "Invalidate current token",
					"request": {
						"method": "POST",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/users/me/logout",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"logout"
							]
						}
					},
					"response": [
						{
							"name": "Logged out",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/users/me/logout",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"logout"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"logout\": true\n}"
						}
					]
				},
				{
					"name": "Change password",
					"request": {
						"method": "PATCH",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"password\": \"<password>\",\n    \"new_password\": \"<password>\",\n    \"new_password_confirmation\": \"<password>\"\n}",
							"options": {
								"raw": {}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/users/me/password",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"users",
								"me",
								"password"
							]
						}
					},
					"response": [
						{
							"name": "Ok",
							"originalRequest": {
								"method": "PATCH",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"password\": \"<password>\",\n    \"new_password\": \"<password>\",\n    \"new_password_confirmation\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/password",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"password"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"email\": \"<email>\",\n \"expires_on\": \"<dateTime>\",\n \"force_pwd_change\": \"<boolean>\",\n \"fresh\": \"<boolean>\",\n \"identity\": \"<uuid>\",\n \"system_role\": \"<string>\",\n \"username\": \"<string>\",\n \"organizations\": \"<list>\"\n}"
						},
						{
							"name": "Unauthorized",
							"originalRequest": {
								"method": "PATCH",
								"header": [],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"password\": \"<password>\",\n    \"new_password\": \"<password>\",\n    \"new_password_confirmation\": \"<password>\"\n}"
								},
								"url": {
									"raw": "{{baseUrl}}/users/me/password",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"users",
										"me",
										"password"
									]
								}
							},
							"status": "Unauthorized",
							"code": 401,
							"_postman_previewlanguage": "text",
							"header": [
								{
									"key": "Content-Type",
									"value": "text/plain"
								}
							],
							"cookie": [],
							"body": ""
						}
					]
				}
			],
			"protocolProfileBehavior": {}
		},
		{
			"name": "tests-admin",
			"item": [
				{
					"name": "users",
					"item": [
						{
							"name": "Create new user for tests. User is instantly activated.",
							"request": {
								"method": "POST",
								"header": [
									{
										"key": "X-local-tests-token",
										"value": "<string>",
										"description": "(Required) "
									},
									{
										"key": "Content-Type",
										"value": "application/json"
									}
								],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<string>\"\n}",
									"options": {
										"raw": {}
									}
								},
								"url": {
									"raw": "{{baseUrl}}/tests-admin/users/create",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"tests-admin",
										"users",
										"create"
									]
								}
							},
							"response": [
								{
									"name": "Unable to create user",
									"originalRequest": {
										"method": "POST",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/users/create",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"users",
												"create"
											]
										}
									},
									"status": "Bad Request",
									"code": 400,
									"_postman_previewlanguage": "json",
									"header": [
										{
											"key": "Content-Type",
											"value": "application/json"
										}
									],
									"cookie": [],
									"body": "{\n \"message\": \"Missing email\"\n}"
								},
								{
									"name": "User created, empty response",
									"originalRequest": {
										"method": "POST",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"email\": \"<email>\",\n    \"password\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/users/create",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"users",
												"create"
											]
										}
									},
									"status": "Accepted",
									"code": 202,
									"_postman_previewlanguage": "text",
									"header": [
										{
											"key": "Content-Type",
											"value": "text/plain"
										}
									],
									"cookie": [],
									"body": ""
								}
							]
						},
						{
							"name": "Register a new user for testing an activation key.",
							"request": {
								"method": "POST",
								"header": [
									{
										"key": "X-local-tests-token",
										"value": "<string>",
										"description": "(Required) "
									},
									{
										"key": "Content-Type",
										"value": "application/json"
									}
								],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"email\": \"<email>\"\n}",
									"options": {
										"raw": {}
									}
								},
								"url": {
									"raw": "{{baseUrl}}/tests-admin/users/register",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"tests-admin",
										"users",
										"register"
									]
								}
							},
							"response": [
								{
									"name": "Unable to register user",
									"originalRequest": {
										"method": "POST",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"email\": \"<email>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/users/register",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"users",
												"register"
											]
										}
									},
									"status": "Bad Request",
									"code": 400,
									"_postman_previewlanguage": "json",
									"header": [
										{
											"key": "Content-Type",
											"value": "application/json"
										}
									],
									"cookie": [],
									"body": "{\n \"message\": \"Missing email\"\n}"
								},
								{
									"name": "User registered, empty response",
									"originalRequest": {
										"method": "POST",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"email\": \"<email>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/users/register",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"users",
												"register"
											]
										}
									},
									"status": "Accepted",
									"code": 202,
									"_postman_previewlanguage": "text",
									"header": [
										{
											"key": "Content-Type",
											"value": "text/plain"
										}
									],
									"cookie": [],
									"body": ""
								}
							]
						}
					],
					"protocolProfileBehavior": {},
					"_postman_isSubFolder": true
				},
				{
					"name": "organizations",
					"item": [
						{
							"name": "{org uuid}/users",
							"item": [
								{
									"name": "Add user to organization by his UUID",
									"request": {
										"method": "POST",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											},
											{
												"key": "Content-Type",
												"value": "application/json"
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"uuid\": \"<uuid>\",\n    \"role\": \"<string>\"\n}",
											"options": {
												"raw": {}
											}
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/organizations/:org_uuid/users",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"organizations",
												":org_uuid",
												"users"
											],
											"variable": [
												{
													"id": "001664b4-1f95-4acf-bb82-d9fb3bacc87b",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										},
										"description": "Used only for local tests. User must already exist"
									},
									"response": [
										{
											"name": "Unable to create or add user",
											"originalRequest": {
												"method": "POST",
												"header": [
													{
														"key": "X-local-tests-token",
														"value": "<string>",
														"description": "(Required) "
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"uuid\": \"<uuid>\",\n    \"role\": \"<string>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/tests-admin/organizations/:org_uuid/users",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"tests-admin",
														"organizations",
														":org_uuid",
														"users"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Bad Request",
											"code": 400,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"<string>\"\n}"
										},
										{
											"name": "Untitled Example",
											"originalRequest": {
												"method": "POST",
												"header": [
													{
														"key": "X-local-tests-token",
														"value": "<string>",
														"description": "(Required) "
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"uuid\": \"<uuid>\",\n    \"role\": \"<string>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/tests-admin/organizations/:org_uuid/users",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"tests-admin",
														"organizations",
														":org_uuid",
														"users"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "OK",
											"code": 200,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"activated\": false,\n \"role\": \"<string>\",\n \"email\": \"<email>\",\n \"username\": \"<string>\",\n \"uuid\": \"<uuid>\"\n}"
										}
									]
								},
								{
									"name": "Remove user from organization",
									"request": {
										"method": "DELETE",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											},
											{
												"key": "Content-Type",
												"value": "application/json"
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"uuid\": \"<uuid>\"\n}",
											"options": {
												"raw": {}
											}
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/organizations/:org_uuid/users",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"organizations",
												":org_uuid",
												"users"
											],
											"variable": [
												{
													"id": "0c9b119a-8064-4a74-acfe-b4725b3b1203",
													"key": "org_uuid",
													"value": "<uuid>",
													"type": "string",
													"description": "(Required) "
												}
											]
										},
										"description": "Used only for local tests."
									},
									"response": [
										{
											"name": "Untitled Example",
											"originalRequest": {
												"method": "DELETE",
												"header": [
													{
														"key": "X-local-tests-token",
														"value": "<string>",
														"description": "(Required) "
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"uuid\": \"<uuid>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/tests-admin/organizations/:org_uuid/users",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"tests-admin",
														"organizations",
														":org_uuid",
														"users"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "No Content",
											"code": 204,
											"_postman_previewlanguage": "text",
											"header": [
												{
													"key": "Content-Type",
													"value": "text/plain"
												}
											],
											"cookie": [],
											"body": ""
										},
										{
											"name": "Unable to create or add user",
											"originalRequest": {
												"method": "DELETE",
												"header": [
													{
														"key": "X-local-tests-token",
														"value": "<string>",
														"description": "(Required) "
													}
												],
												"body": {
													"mode": "raw",
													"raw": "{\n    \"uuid\": \"<uuid>\"\n}"
												},
												"url": {
													"raw": "{{baseUrl}}/tests-admin/organizations/:org_uuid/users",
													"host": [
														"{{baseUrl}}"
													],
													"path": [
														"tests-admin",
														"organizations",
														":org_uuid",
														"users"
													],
													"variable": [
														{
															"key": "org_uuid"
														}
													]
												}
											},
											"status": "Bad Request",
											"code": 400,
											"_postman_previewlanguage": "json",
											"header": [
												{
													"key": "Content-Type",
													"value": "application/json"
												}
											],
											"cookie": [],
											"body": "{\n \"message\": \"<string>\"\n}"
										}
									]
								}
							],
							"protocolProfileBehavior": {},
							"_postman_isSubFolder": true
						},
						{
							"name": "Create organization",
							"request": {
								"method": "POST",
								"header": [
									{
										"key": "X-local-tests-token",
										"value": "<string>",
										"description": "(Required) "
									},
									{
										"key": "Content-Type",
										"value": "application/json"
									}
								],
								"body": {
									"mode": "raw",
									"raw": "{\n    \"name\": \"<string>\",\n    \"local-tests-token\": \"<string>\"\n}",
									"options": {
										"raw": {}
									}
								},
								"url": {
									"raw": "{{baseUrl}}/tests-admin/organizations/",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"tests-admin",
										"organizations",
										""
									]
								}
							},
							"response": [
								{
									"name": "Untitled Example",
									"originalRequest": {
										"method": "POST",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"name\": \"<string>\",\n    \"local-tests-token\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/organizations/",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"organizations",
												""
											]
										}
									},
									"status": "OK",
									"code": 200,
									"_postman_previewlanguage": "json",
									"header": [
										{
											"key": "Content-Type",
											"value": "application/json"
										}
									],
									"cookie": [],
									"body": "{\n \"name\": \"<string>\",\n \"uuid\": \"<string>\"\n}"
								},
								{
									"name": "Unable to create org",
									"originalRequest": {
										"method": "POST",
										"header": [
											{
												"key": "X-local-tests-token",
												"value": "<string>",
												"description": "(Required) "
											}
										],
										"body": {
											"mode": "raw",
											"raw": "{\n    \"name\": \"<string>\",\n    \"local-tests-token\": \"<string>\"\n}"
										},
										"url": {
											"raw": "{{baseUrl}}/tests-admin/organizations/",
											"host": [
												"{{baseUrl}}"
											],
											"path": [
												"tests-admin",
												"organizations",
												""
											]
										}
									},
									"status": "Bad Request",
									"code": 400,
									"_postman_previewlanguage": "json",
									"header": [
										{
											"key": "Content-Type",
											"value": "application/json"
										}
									],
									"cookie": [],
									"body": "{\n \"message\": \"<string>\"\n}"
								}
							]
						}
					],
					"protocolProfileBehavior": {},
					"_postman_isSubFolder": true
				}
			],
			"protocolProfileBehavior": {}
		},
		{
			"name": "octoprint-emulator/api",
			"item": [
				{
					"name": "Get octoprint version - this returns dummy version to trick some slicers into thinking this is a valid Octoprint, otherwise they won't talk to us",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/octoprint-emulator/api/version",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"octoprint-emulator",
								"api",
								"version"
							]
						}
					},
					"response": [
						{
							"name": "Untitled Example",
							"originalRequest": {
								"method": "GET",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/octoprint-emulator/api/version",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"octoprint-emulator",
										"api",
										"version"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"api\": \"karmen\",\n \"text\": \"OctoPrint emulator by Karmen\",\n \"server\": \"v0.9.0\"\n}"
						}
					]
				},
				{
					"name": "Gect octoprint settings - this returns dummy settings to trick some slicers into thinking this is a valid Octoprint, otherwise they won't talk to us",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/octoprint-emulator/api/settings",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"octoprint-emulator",
								"api",
								"settings"
							]
						}
					},
					"response": [
						{
							"name": "Untitled Example",
							"originalRequest": {
								"method": "GET",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/octoprint-emulator/api/settings",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"octoprint-emulator",
										"api",
										"settings"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "\"<object>\""
						}
					]
				},
				{
					"name": "Get printer status - this returns dummy status to trick some slicers into thinking this is a valid Octoprint, otherwise they won't talk to us",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/octoprint-emulator/api/printer",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"octoprint-emulator",
								"api",
								"printer"
							]
						}
					},
					"response": [
						{
							"name": "Untitled Example",
							"originalRequest": {
								"method": "GET",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/octoprint-emulator/api/printer",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"octoprint-emulator",
										"api",
										"printer"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"sd\": {\n  \"ready\": true\n },\n \"state\": {\n  \"text\": \"Operational\",\n  \"flags\": {\n   \"cancelling\": false,\n   \"closedOnError\": false,\n   \"error\": false,\n   \"finishing\": false,\n   \"operational\": true,\n   \"paused\": false,\n   \"pausing\": false,\n   \"printing\": false,\n   \"ready\": true,\n   \"resuming\": false,\n   \"sdReady\": true\n  }\n }\n}"
						}
					]
				},
				{
					"name": "Get job status - this returns dummy status to trick some slicers into thinking this is a valid Octoprint, otherwise they won't talk to us",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/octoprint-emulator/api/job",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"octoprint-emulator",
								"api",
								"job"
							]
						}
					},
					"response": [
						{
							"name": "Untitled Example",
							"originalRequest": {
								"method": "GET",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/octoprint-emulator/api/job",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"octoprint-emulator",
										"api",
										"job"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"job\": \"<object>\"\n}"
						}
					]
				},
				{
					"name": "Upload gcode to Karmen. Pretends to be Octoprint so you can use \"Send gcode to octoprint\" option in some slicers",
					"request": {
						"method": "POST",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/octoprint-emulator/api/files/local",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"octoprint-emulator",
								"api",
								"files",
								"local"
							]
						}
					},
					"response": [
						{
							"name": "Untitled Example",
							"originalRequest": {
								"method": "POST",
								"header": [],
								"url": {
									"raw": "{{baseUrl}}/octoprint-emulator/api/files/local",
									"host": [
										"{{baseUrl}}"
									],
									"path": [
										"octoprint-emulator",
										"api",
										"files",
										"local"
									]
								}
							},
							"status": "OK",
							"code": 200,
							"_postman_previewlanguage": "json",
							"header": [
								{
									"key": "Content-Type",
									"value": "application/json"
								}
							],
							"cookie": [],
							"body": "{\n \"files\": {\n  \"local\": {\n   \"name\": \"<string>\",\n   \"display\": \"<string>\",\n   \"path\": \"<string>\",\n   \"origin\": \"local\"\n  }\n }\n}"
						}
					]
				}
			],
			"protocolProfileBehavior": {}
		}
	],
	"variable": [
		{
			"id": "baseUrl",
			"key": "baseUrl",
			"value": "/",
			"type": "string"
		}
	],
	"protocolProfileBehavior": {}
}