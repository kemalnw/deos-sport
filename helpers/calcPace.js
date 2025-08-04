module.exports = (distance, duration) => {
    if (!distance || !duration) return null;

    const expDuration = duration.split(":");
    const minute = +expDuration[0];
    const second = +expDuration[1];

    const time = (minute * 60) + second;
    const km = +distance / 1000;

    const rTime = time / km;
    let rMinute = `${Math.floor(rTime / 60)}`;
    let rSecond = `${Math.floor(rTime % 60)}`;
    if (rMinute.length === 1) rMinute = `0${rMinute}`;
    if (rSecond.length === 1) rSecond = `0${rSecond}`;

    return `${rMinute}:${rSecond}`;
}