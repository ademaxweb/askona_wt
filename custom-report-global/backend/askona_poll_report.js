Request.RespContentType = 'application/json';
Request.AddRespHeader("Access-Control-Allow-Origin", "*");
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

function AddColumn(columns, text, key)
{
    columns.push(
        {
            value: text,
            key: key
        }
    )
}

function SetColumns(columns, questions)
{
    AddColumn(columns, "ФИО", "coll_fullname");
    AddColumn(columns, "Должность", "coll_position");
    AddColumn(columns, "Подразделение", "coll_subdivision");
    AddColumn(columns, "Организация", "coll_org");
    AddColumn(columns, "Опрос", "poll_name");

    for (_q in questions)
    {
        AddColumn(columns, _q.title, "question" + _q.id);
    }
}

function SetRows(rows, poll_results, poll_info)
{
    for (_res in poll_results)
    {
        _res_te = OpenDoc(UrlFromDocID(Int(_res.id))).TopElem;

        _person = ArrayOptFirstElem(XQuery("for $c in collaborators where id=" + _res_te.person_id.Value + " return $c"), null);


        if (_person == null)
        {
            continue;
        }

        _row =
            {
                coll_fullname: _person.fullname.Value,
                coll_position: _person.position_name.Value,
                coll_subdivision: _person.position_parent_name.Value,
                coll_org: _person.org_name.Value,
                poll_name: poll_info.name
                
            };


        // Цикл по вопросам в карточке опроса
        for (_q in poll_info.questions)
        {
            // Ответ на вопрос в карточке результ
            _question_answer = ArrayOptFirstElem(ArraySelectByKey(_res_te.questions, _q.id.Value, "id"), null);
            

            // Будет записано в отчет
            _answer = "-"


            // Если есть ответ пользователя на текущий вопрос
            if (_question_answer != null)
            {
                switch (_q.type)
                {
                    case "choice":
                        // Получаем выбранный вариант ответа
                        _answer_option = ArrayOptFirstElem(ArraySelectByKey(_q.answers, _question_answer.value.Value, "id"), null)
                        _answer = _answer_option != null ? _answer_option.value
                        break;

                    case "text":
                        _answer = _question_answer.value.Value;
                        break;
                }           
            }

            row["question"+_q.id.Value] = _answer;
        }


        rows.push(_row);
    }
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

function ParseQuestionAnswers (question)
{
    _answers = [];

    if (!question.HasChild("entries")) return _answers;

    for (_a in question.entries)
    {
        _answers.push =
            {
                id: _a.id.Value,
                value: _a.value.Value,
                weight: (_a.HasChild("weight") ? _a.weight.Value : 0)
            };
    }

    return _answers;
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
            title: _q.title.Value,
            answers: ParseQuestionAnswers(_q),
            commentable: Boolean(_q.add_comment.Value)
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

    var _poll_info = GetPollInfo(_params.poll_id)
    var _poll_res = GetPollResults(_params.coll_id, _params.poll_id);

    var _report_columns = [];
    var _report_rows = [];

    SetColumns(_report_columns, _poll_info.questions);
    SetRows(_report_rows, _poll_res, _poll_info);

    SendResponse(
        true,
        "Отчет успешно сформирован",
        {
            columns: _report_columns,
            rows: _report_rows
        }
    )
}
catch (err)
{
    Log(String(err));
    SendResponse(false, err.message, {err: String(err)});
}