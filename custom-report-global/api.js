const useAPI = () => {
    const send = async (url, method = "GET", data = {}, params) => {
        
        const query_params = {
            method,
            ...params
        }

        switch (method) {
            case "GET":
                url += new URLSearchParams(data)
                break
            
            default:
                query_params["body"] = JSON.stringify(data)
                query_params["headers"]["content_type"] = "application/json"
        }

        const response = await fetch(url, query_params)

        if (!response.ok) throw response

        return await response.json()
    }

    return {send}
}