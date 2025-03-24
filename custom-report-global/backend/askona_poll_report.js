var _log_tag = "poll_report"
EnableLog(_log_tag)

function Log(message)
{
    LogEvent(_log_tag, message)
}

function SendResponse(success, message, data)
{
    Response.Write(tools.object_to_text(
        {
            success: success,
            message: message,
            data: data
        },
        "json"
    ))
}

function ParseQueryParams() {
    return {
        poll_id: Request.Query.GetOptProperty("poll_id", null),
        coll_id: Request.Query.GetOptProperty("coll_id", null)
    }
}

function AddColumn(columns, key, text)
{
    columns.push(
        {
            value: text,
            key: key
        }
    )
}

function SetColumns(columns)
{
    AddColumn(columns, "ФИО", "coll_fullname");
    AddColumn(columns, "Руководитель", "coll_fullname");
    AddColumn(columns, "Должность", "coll_fullname");
    AddColumn(columns, "Подразделение", "coll_subdivision"),
    AddColumn(columns, "Организация", "coll_org"),
    AddColumn(columns, "Опрос", "poll_name")
}

function GetPollResults(coll_id, poll_id)
{
    var _sql =
        "SELECT \
            * \
        FROM dbo.poll_results \
        WHERE poll_id=" + poll_id + " AND person_id="+coll_id;

    return ArrayDirect(XQuery("sql: " + _sql));
}

function GetPollInfo(poll_id)
{
    var _poll_te = OpenDoc(UrlFromDocID(Int(poll_id))).TopElem;

    var _questions = [];

    for (_q in _poll_te.questions)
    {
        _questions.push({
            id: _q.id.Value,
            type: _q.type.Value,
            weight: _q.weight.Value,
            title: _q.title.Value
        })
    }
    
    return {
        name: _poll_te.name.Value,
        questions: _questions
    }
}

try
{
    var _params = ParseQueryParams();

    var _poll_res = GetPollResults(_params.coll_id, _params.poll_id);

    var _report_columns = [];
    SetColumns(_report_columns);

    var _report_rows = [];

}
catch (err)
{

}