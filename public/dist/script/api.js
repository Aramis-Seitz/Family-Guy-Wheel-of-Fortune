export async function fetchRandomNumber() {
    const response = await fetch("api/dist/utils/random.js");
    if (!response.ok) {
        throw new Error("Server response not ok.");
    }
    const data = await response.json();
    return data.ranNum;
}
