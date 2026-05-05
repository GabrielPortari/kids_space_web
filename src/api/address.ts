export type BackendAddressPayload = {
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
  country?: string;
  zipcode?: string;
};

export type AddressFormLike = {
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressComplement: string;
  addressCountry?: string;
};

export function buildBackendAddressPayload(
  values: AddressFormLike,
): BackendAddressPayload {
  const payload: BackendAddressPayload = {
    address: values.addressStreet.trim(),
    number: values.addressNumber.trim(),
    neighborhood: values.addressDistrict.trim(),
    city: values.addressCity.trim(),
    state: values.addressState.trim(),
  };

  const complement = values.addressComplement.trim();
  if (complement) {
    payload.complement = complement;
  }

  const zipcode = values.addressZipCode.replace(/\D/g, "").slice(0, 8);
  if (zipcode) {
    payload.zipcode = zipcode;
  }

  const country = (values.addressCountry || "").trim();
  if (country) {
    payload.country = country;
  }

  return payload;
}
