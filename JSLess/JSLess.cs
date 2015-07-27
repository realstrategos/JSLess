using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Helpers;

namespace JSLess
{
    public static class JsonExtensions
    {
        //public static string ToJsonObject<T>(this T source)
        //{            
        //    var ret = Json.Encode(source);
        //    return ret;
        //}
        public static HtmlString ToJsonObject<T>(this T source)
        {
            StringBuilder sb = new StringBuilder();
            using (StringWriter sw = new StringWriter(sb))
            {
                using (JsonTextWriter writer = new JsonTextWriter(sw))
                {
                    writer.QuoteChar = '\'';
                    writer.QuoteName = false;
                    writer.StringEscapeHandling = StringEscapeHandling.EscapeHtml;

                    JsonSerializer ser = new JsonSerializer();
                    ser.Serialize(writer, source);
                }
            }
            var json = sb.ToString();
            return new HtmlString(json);
            //return json;
            //return new HtmlString("JSON.parse('" + json + "')");
        }

    }
}