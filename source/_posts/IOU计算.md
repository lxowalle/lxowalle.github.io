# IOU计算

在目标检测当中，有一个重要的概念就是 IOU。一般指代模型预测的 bbox 和 Groud Truth 之间的交并比。交并比是指两张图片交集部分与两张图片的并集部分相比的值，即(P1 ∩ P2)/(P1 ∪ P2)

计算IOU总结为：两张图片相交部分面积除以两张图片叠加后的总面积(图片叠加后重叠的部分只计算一次)

IOU代码
```c
typedef struct
{
  int32_t x;
  int32_t y;
} mf_point_t;


/**
 * @brief 计算IOU(只考虑了两张图片不旋转的情况)
 * @details
 *                               x
 *                               |
 *                               |____ y  (注意坐标轴是颠倒的)
 *       _________B(x,y)
 *      |         |
 *      |     ____|F(x,y)___D(x,y)
 *      |    |    |         |
 *      |    |    |         |
 *      |____|____|         |
 *  A(x,y)   |E(x,y)        |
 *           |______________|
 *          C(x,y)
 * 
 * 交集：a = (B(y) - C(y)) * (D(x) - A(x))
 * 并集：b = 两个图片面积之和 - a
 * 计算IOU: res = a / b 
 * @param 
 * @return 返回IOU值
*/
static double _caculate_face_iou(face_obj_t *rgb_face, face_obj_t *ir_face)
{
    if (rgb_face == NULL || ir_face == NULL)    return 0;

    /* 坐标映射 */
    mf_point_t A = {.x = rgb_face->x1,.y = rgb_face->y1};
    mf_point_t B = {.x = rgb_face->x2,.y = rgb_face->y2};
    mf_point_t C = {.x = ir_face->x1,.y = ir_face->y1}; // 手动映射
    mf_point_t D = {.x = ir_face->x2,.y = ir_face->y2};  // 手动映射
    mf_point_t E,F;
    E.x = (C.x <= B.x && C.x >= A.x) ? C.x : A.x;
    E.y = (C.y <= B.y && C.y >= A.y) ? C.y : A.y;
    F.x = (D.x <= B.x && D.x >= A.x) ? D.x : B.x;
    F.y = (D.y <= B.y && D.y >= A.y) ? D.y : B.y;
#if 0
    printf("A:(%d,%d)  B:(%d,%d)\n", A.x, A.y, B.x, B.y);
    printf("C:(%d,%d)  D:(%d,%d)\n", C.x, C.y, D.x, D.y);
    printf("E:(%d,%d)  F:(%d,%d)\n", E.x, E.y, F.x, F.y);
#endif

    /* 交集部分 */
    int32_t a = abs(F.y - E.y) * abs(F.x - E.x);

    /* 并集部分 */
    int32_t rgb_area = abs(B.y - A.y) * abs(B.x - A.x);
    int32_t ir_area = abs(D.y - C.y) * abs(D.x - C.x);
    int32_t b = abs(rgb_area) + abs(ir_area) - a;

    /* 计算iou */
    if (b == 0 || a > b)  return 0;
    double res = (double)a / (double)b;

#if 0
    printf("IOU res: %f\n", res);
#endif
    return res;
}
```