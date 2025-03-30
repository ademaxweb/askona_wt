const buildCollectionParams = (params) => {
    return Object.entries(params).map(([key, value]) => `${key}=${value}`).join(';')
}

const useApi = () => {

    const send = async (url, method = "GET", data = {}, params = {}) => {
        
        const query_params = {
            method,
            ...params,
        }

        

        switch (method) {
            case "GET":
                url += `?${new URLSearchParams(JSON.parse(JSON.stringify(data)))}`
                break
            
            default:
                query_params.body = new URLSearchParams(data)
                // query_params.headers = query_params.headers || {}
                // query_params.headers["Content-Type"] = "application/json"
        }

        const response = await fetch(url, query_params)

        if (!response.ok) throw response

        return await response.json()
    }

    const reports = useApiReports({send})
    const search = useApiSearch({send})

    return {send, reports, search}
}

const useApiSearch = (api) => {
    const search = async ({catalog, field, text}) => {
        return api.send(
            '/pp/Ext5/extjs_json_collection_data.html',
            "POST",
            {
                collection_code: "askona_search_object",
                parameters: buildCollectionParams({
                    catalog,
                    search_field: field,
                    search_str: text
                })
            }
        )
    }

    const collaborators = async (name) => {
        return search({
            catalog: "collaborators",
            field: "fullname",
            text: name
        })
    }

    const polls = async (name) => {
        return search({
            catalog: "polls",
            field: "name",
            text: name
        })
    }

    const assessment_appraises = async(name) => {
        return search({
            catalog: "assessment_appraises",
            field: "name",
            text: name
        })
    }

    return {search, collaborators, polls, assessment_appraises}
}


const useApiReports = (api) => {
    const polls = async ({poll_id, coll_id}) => {
        return api.send(
            '/custom_web_template.html',
            "GET",
            {
                object_code: "askona_polls_report_handler",
                poll_id,
                coll_id
            }
        )
    }

    const assessment_appraises = async ({appr_id, person_id}) => {
        return api.send(
            '/custom_web_template.html',
            "GET",
            {
                object_code: "askona_assessment_report_handler",
                appr_id: appr_id,
                coll_id: person_id
            }
        )
    }

    return {polls, assessment_appraises}
}