import Dinero, { Currency } from "dinero.js";

export const countDecimals = function (value: number) {
    if (Math.floor(value.valueOf()) === value.valueOf()) return 0;
    return value.toString().split(".")[1].length || 0;
}

export const convertFloatAmountToInteger = function (value: string): { amount: number; decimals: number; } {
    const numericValue = parseFloat(value);
    if (countDecimals(numericValue) > 0) {
        const decimals = countDecimals(numericValue);
        const parts = numericValue.toString().split('.');
        return { amount: parseInt(`${parts[0]}${parts[1]}`), decimals };
    }

    return { amount: numericValue, decimals: 0 };
}

export const formattedAmount = function (amount: number, decimals: number) {
    return (amount / Math.pow(10, decimals)).toString();
}

export const formattedLocalizedAmount = function (amount: number, decimals: number, currency: string, locale: string) {
    const currencyConfig = { amount, precision: decimals, currency } as { amount: number, precision: number, currency: Currency };
    return Dinero(currencyConfig).toFormat();
}
