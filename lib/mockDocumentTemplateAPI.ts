import { DocumentTemplate } from '@/types/sales-order';

export function getMockDocumentTemplate(dt_id: string): DocumentTemplate {
  return {
    id: "0366c98d-7df0-4145-adc0-6ba15c1fa9ae",
    status: "draft",
    sort: null,
    user_created: "ff6bac11-0e46-419b-8d39-bac0203e95ec",
    date_created: "2024-11-08T11:47:19.000Z",
    user_updated: "df1ed585-5aef-4e97-8b77-85b96f5ffe62",
    date_updated: "2025-01-09T08:00:16.000Z",
    name: "files wantwant",
    components: [
      {
        h: 1700,
        w: 1005,
        x: 8,
        y: 36,
        h1: "",
        key: "ADDITIONAL_COMPONENT",
        raw: {
          type: "table",
          fields: [
            {
              type: "string",
              field: "title",
              schema: {
                name: "title",
                table: "directus_files",
                data_type: "varchar",
                max_length: 255,
                is_nullable: true,
              },
            },
          ],
          columns: [
            {
              name: "title",
              align: "left",
              field: "title",
              label: "title",
              required: true,
              sortable: false,
            },
          ],
          filters: [
            {
              op: {
                key: "_eq",
                label: "Equals to"
              },
              field: "folder",
              value: "638a1e8c-68e4-4d83-ac7a-72432b1f413d",
            }
          ],
        },
        uuid: "3147deeb-16b4-47d9-bf9d-1008e711cc3c",
        field: "files",
        component: "table",
      },
      {
        h: 800,
        w: 600,
        x: 20,
        y: 50,
        h1: "Order Preview",
        key: "ORDER_PREVIEW",
        raw: {
          ui_type: "OrderPreview",
          config: {
            showCustomerInfo: true,
            showOrderLines: true,
            showTotals: true,
            showNotes: true,
          }
        },
        uuid: "4258efcf-27c5-4bfa-b7d0-9c8a1e6d3a2b",
        field: "orderPreview",
        component: "custom",
      }
    ],
    type: "job",
    autofill: false,
    redirect_path: null,
    orq: 63,
    lock: null,
    is_golden: null,
  };
}

