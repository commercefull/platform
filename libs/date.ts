export function unixTimestamp() {
    return (new Date()).toISOString()
}

export function dayFormattedName(dateString: string) {
    var d = new Date(dateString);
    return `${d.getDate()}/${(d.getMonth()+1)}/${d.getFullYear()}`;
}