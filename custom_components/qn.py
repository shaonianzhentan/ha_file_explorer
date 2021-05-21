import os

class Qn():

    def __init__(self, qiniu, auth, sync_to_async, bucket_name, prefix, download):
        self.qiniu = qiniu
        self.auth = auth
        self.sync_to_async = sync_to_async
        self.bucket_name = bucket_name
        self.prefix = prefix
        self.download = download

    # 获取列表
    async def get_list(self, prefix):
        bucket = self.qiniu.BucketManager(self.auth)
        bucket_name = self.bucket_name
        # 前缀
        prefix = 'HomeAssistant/' + self.prefix
        # 列举条目
        limit = 50
        # 列举出除'/'的所有文件以及以'/'为分隔的所有前缀
        delimiter = None
        # 标记
        marker = None
        ret, eof, info = await self.sync_to_async(bucket.list)(bucket_name, prefix, marker, limit, delimiter)
        # print(info)
        return {
            'download': self.download,
            'list': ret
        }

    # 上传
    async def upload(self, localfile):
        key = 'HomeAssistant/' + self.prefix + os.path.basename(localfile)
        token = self.auth.upload_token(self.bucket_name, key, 3600)
        res = await self.sync_to_async(self.qiniu.put_file)(token, key, localfile)
        print(res)
    
    # 删除
    async def delete(self, key):
        bucket = self.qiniu.BucketManager(self.auth)
        ret, info = await self.sync_to_async(bucket.delete)(self.bucket_name, key)
        print(info)