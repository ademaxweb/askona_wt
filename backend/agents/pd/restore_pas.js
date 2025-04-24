var _log_tag = "restore_pas_pd_17_03"
EnableLog(_log_tag)
function Log(message)
{
    if (DataType(message) == "object")
    {
        message = tools.object_to_text(message, "json");
    }

    LogEvent(_log_tag, message)
}


try
{
    var _sql = "SELECT * FROM WTDB_PUBLIC.dbo.pas WHERE assessment_appraise_id = 7482662908717264132"
    var _res = ArraySelectAll(XQuery("sql: " + _sql));
    Log(ArrayCount(_res));
}
catch(e)
{
    Log("Ошибка в Main thread: " + String(e));
}