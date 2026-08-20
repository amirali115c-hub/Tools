export type SchemaType =
  | 'Organization'
  | 'LocalBusiness'
  | 'WebPage'
  | 'Article'
  | 'BlogPosting'
  | 'Product'
  | 'Service'
  | 'FAQPage'
  | 'HowTo'
  | 'Event'
  | 'Recipe'
  | 'VideoObject'
  | 'SoftwareApplication'
  | 'BreadcrumbList'
  | 'Person'
  | 'MedicalBusiness';

export interface SchemaField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'tel' | 'number' | 'select' | 'repeater';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  fields?: SchemaField[];
}

export interface SchemaTemplate {
  type: SchemaType;
  label: string;
  description: string;
  fields: SchemaField[];
}
