using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Helpers;

namespace JSLess
{
    public static class JsonExtensions
    {
        public static string ToJsonObject<T>(this T source)
        {            
            var ret = Json.Encode(source);
            return ret;

        }

    }
}