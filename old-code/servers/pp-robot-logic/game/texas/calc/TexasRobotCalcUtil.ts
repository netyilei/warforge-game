export namespace TexasRobotCalcUtil {
    export function combNumbers(x: number, y: number) {
        var a = 1
        var b = 1
        for (var i = y; i > 0; i--) {
          a *= x
          x -= 1
          b *= i
        }
        return a / b 
    }

    export function combination (arr, num) {
        var r = [];
        (function f (t, a, n) {
          if (n === 0) {
            return r.push(t)
          }
          for (var i = 0, l = a.length; i <= l - n; i++) {
            f(t.concat(a[i]), a.slice(i + 1), n - 1)
          }
        })([], arr, num)
        return r
    }
}