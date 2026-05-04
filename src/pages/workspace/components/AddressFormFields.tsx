import { maskZipCode, normalizeDigits } from "../formatter";

type AddressFormFieldsProps = {
  values: {
    addressStreet: string;
    addressNumber: string;
    addressDistrict: string;
    addressCity: string;
    addressState: string;
    addressZipCode: string;
    addressComplement: string;
    addressCountry: string;
  };
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
};

export function AddressFormFields({
  values,
  onChange,
  disabled = false,
}: AddressFormFieldsProps) {
  const handleAddressChange = (field: string, value: string) => {
    if (field === "addressZipCode") {
      onChange(field, normalizeDigits(value).slice(0, 8));
    } else {
      onChange(field, value);
    }
  };

  return (
    <div className="profile-section address-section">
      <h3>Endereco</h3>
      <div className="address-grid">
        <div className="field">
          <label htmlFor="address-street">Rua</label>
          <input
            id="address-street"
            value={values.addressStreet}
            onChange={(event) =>
              handleAddressChange("addressStreet", event.target.value)
            }
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label htmlFor="address-number">Numero</label>
          <input
            id="address-number"
            value={values.addressNumber}
            onChange={(event) =>
              handleAddressChange("addressNumber", event.target.value)
            }
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label htmlFor="address-district">Bairro</label>
          <input
            id="address-district"
            value={values.addressDistrict}
            onChange={(event) =>
              handleAddressChange("addressDistrict", event.target.value)
            }
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label htmlFor="address-city">Cidade</label>
          <input
            id="address-city"
            value={values.addressCity}
            onChange={(event) =>
              handleAddressChange("addressCity", event.target.value)
            }
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label htmlFor="address-state">Estado</label>
          <input
            id="address-state"
            value={values.addressState}
            onChange={(event) =>
              handleAddressChange("addressState", event.target.value)
            }
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label htmlFor="address-zipcode">CEP</label>
          <input
            id="address-zipcode"
            value={maskZipCode(values.addressZipCode)}
            onChange={(event) =>
              handleAddressChange("addressZipCode", event.target.value)
            }
            placeholder="00000-000"
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label htmlFor="address-complement">Complemento</label>
          <input
            id="address-complement"
            value={values.addressComplement}
            onChange={(event) =>
              handleAddressChange("addressComplement", event.target.value)
            }
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label htmlFor="address-country">Pais</label>
          <input
            id="address-country"
            value={values.addressCountry}
            onChange={(event) =>
              handleAddressChange("addressCountry", event.target.value)
            }
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
