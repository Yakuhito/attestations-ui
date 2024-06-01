import React from 'react';

interface ValidatorIndexInputProps {
  validatorIndex: number;
  setValidatorIndex: (index: number) => void;
}

const ValidatorIndexInput: React.FC<ValidatorIndexInputProps> = ({ validatorIndex, setValidatorIndex }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setValidatorIndex(parseInt(event.target.value, 10));
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="validatorIndex" className="text-zinc-300">
        Validator Index:
      </label>
      <select
        id="validatorIndex"
        value={validatorIndex}
        onChange={handleChange}
        className="bg-zinc-800 text-zinc-300 border border-zinc-600 rounded p-2"
      >
        {Array.from({ length: 11 }, (_, index) => (
          <option key={index} value={index}>
            {index}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ValidatorIndexInput;
